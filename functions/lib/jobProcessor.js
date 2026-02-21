/**
 * Step-based, resumable job processor. Topic-agnostic; soccer is one preset.
 * Steps: generate_content → tts → render (placeholder or external worker).
 * Each step is idempotent: skips if outputs already exist.
 */

import { getJobById, updateJob } from './db.js';
import { getBaseUrl } from './config.js';
import { generateStoryDraft } from './story.js';
import { generateContentWithLLM } from './contentGenerator.js';

export const JOBS_PREFIX = 'jobs';
const STEP_NAMES = ['generate_content', 'tts', 'render'];
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

function parseSteps(stepsJson) {
  if (stepsJson == null) return [];
  try {
    const arr = typeof stepsJson === 'string' ? JSON.parse(stepsJson) : stepsJson;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function findStep(steps, name) {
  return steps.find((s) => s.name === name);
}

function stepCompleted(steps, name) {
  const s = findStep(steps, name);
  return s && s.status === 'completed';
}

function withStep(steps, name, update) {
  const now = new Date().toISOString();
  const existing = findStep(steps, name);
  const base = existing || { name, status: 'running', attempts: 0, started_at: null, finished_at: null, error: null };
  const next = { ...base, ...update };
  if (!next.started_at && update.status) next.started_at = next.started_at || now;
  if (update.status === 'completed' || update.status === 'failed') next.finished_at = now;
  const out = steps.filter((s) => s.name !== name);
  out.push(next);
  return out.sort((a, b) => STEP_NAMES.indexOf(a.name) - STEP_NAMES.indexOf(b.name));
}

export async function runJob(env, jobId, job) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error('R2 not configured');
  const prefix = `${JOBS_PREFIX}/${jobId}`;
  let steps = parseSteps(job.steps_json);

  try {
    await updateJob(env, jobId, { status: 'processing' });

    // —— Step 1: generate_content (script, caption, hashtags; write captions.json, srt draft, cover) ——
    if (!stepCompleted(steps, 'generate_content')) {
      if (job.script_json && job.caption) {
        steps = withStep(steps, 'generate_content', { status: 'completed', attempts: 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
      } else {
        steps = withStep(steps, 'generate_content', { status: 'running', attempts: (findStep(steps, 'generate_content')?.attempts ?? 0) + 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });

        const topic = job.topic || 'general';
        const tone = job.tone || 'factual';
        const durationSec = job.duration_sec ?? 45;
        let script;
        let caption;
        let hashtags;

        if (env.LLM_API_KEY) {
          try {
            const result = await generateContentWithLLM(env, { topic, context: job.context_json, tone, durationSec });
            script = result.script;
            caption = result.caption;
            hashtags = result.hashtags;
          } catch (e) {
            console.error('LLM content generation failed, using fallback:', e.message);
            const story = generateStoryDraft(topic, tone, 3, 10);
            caption = story.headline;
            hashtags = '#shortvideo #story #viral';
            script = { slides: JSON.parse(story.story_json || '{}').slides || [], durationSec };
          }
        } else {
          const story = generateStoryDraft(topic, tone, 3, 10);
          caption = story.headline;
          hashtags = '#shortvideo #story #viral';
          script = { slides: JSON.parse(story.story_json || '{}').slides || [], durationSec };
        }

        const captionsJson = JSON.stringify({ caption, hashtags, script });
        await bucket.put(`${prefix}/captions.json`, new TextEncoder().encode(captionsJson), { httpMetadata: { contentType: 'application/json' } });
        const srt = '1\n00:00:00,000 --> 00:00:05,000\n' + (caption || '') + '\n';
        await bucket.put(`${prefix}/subtitles.srt`, new TextEncoder().encode(srt), { httpMetadata: { contentType: 'application/x-subrip' } });
        const coverPng = getMinimalPngBytes();
        await bucket.put(`${prefix}/cover.png`, coverPng, { httpMetadata: { contentType: 'image/png' } });

        steps = withStep(steps, 'generate_content', { status: 'completed' });
        await updateJob(env, jobId, {
          script_json: JSON.stringify(script),
          caption,
          hashtags,
          output_captions_json: `${prefix}/captions.json`,
          output_subtitles_srt: `${prefix}/subtitles.srt`,
          output_cover_png: `${prefix}/cover.png`,
          steps_json: JSON.stringify(steps),
        });
      }
    }

    // Re-read job for script/caption (in case we skipped generate_content)
    const { job: job2 } = await getJobById(env, jobId);
    job.script_json = job2.script_json;
    job.caption = job2.caption;
    job.hashtags = job2.hashtags;
    steps = parseSteps(job2.steps_json);

    const script = job.script_json ? (typeof job.script_json === 'string' ? JSON.parse(job.script_json) : job.script_json) : null;
    const scriptText = script?.slides?.map((s) => s.text).join(' ') || job.caption || '';

    // —— Step 2: tts (optional) ——
    if (!stepCompleted(steps, 'tts')) {
      const hasAudio = (await bucket.get(`${prefix}/audio.mp3`)) != null;
      if (hasAudio) {
        steps = withStep(steps, 'tts', { status: 'completed', attempts: 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
      } else if (env.ELEVENLABS_API_KEY && scriptText) {
        steps = withStep(steps, 'tts', { status: 'running', attempts: (findStep(steps, 'tts')?.attempts ?? 0) + 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
        try {
          const audioBytes = await fetchElevenLabsTTS(env.ELEVENLABS_API_KEY, scriptText, env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID);
          if (audioBytes?.byteLength > 0) {
            await bucket.put(`${prefix}/audio.mp3`, audioBytes, { httpMetadata: { contentType: 'audio/mpeg' } });
            steps = withStep(steps, 'tts', { status: 'completed' });
            await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
          }
        } catch (e) {
          steps = withStep(steps, 'tts', { status: 'failed', error: e.message });
          await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
        }
      }
    }

    const { job: job3 } = await getJobById(env, jobId);
    steps = parseSteps(job3.steps_json);

    // —— Step 3: render (external worker or placeholder) ——
    if (!stepCompleted(steps, 'render')) {
      const hasMp4 = job3.output_final_mp4 && (await bucket.get(job3.output_final_mp4)) != null;
      if (hasMp4) {
        steps = withStep(steps, 'render', { status: 'completed', attempts: 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps), status: 'completed' });
        return;
      }

      const useExternalVideo = env.EXTERNAL_VIDEO_WORKER_URL && env.WEBHOOK_SECRET;
      const hasAudio = (await bucket.get(`${prefix}/audio.mp3`)) != null;

      if (useExternalVideo && hasAudio) {
        steps = withStep(steps, 'render', { status: 'running', attempts: (findStep(steps, 'render')?.attempts ?? 0) + 1 });
        await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
        const baseUrl = getBaseUrl(env);
        const audioUrl = `${baseUrl}/api/jobs/${jobId}/asset/audio`;
        const uploadUrl = `${baseUrl}/api/jobs/${jobId}/upload-video`;
        try {
          await fetch(env.EXTERNAL_VIDEO_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, audioUrl, uploadUrl, webhookSecret: env.WEBHOOK_SECRET }),
          });
        } catch (e) {
          steps = withStep(steps, 'render', { status: 'failed', error: e.message });
          await updateJob(env, jobId, { status: 'failed', error: `External worker: ${e.message}`, steps_json: JSON.stringify(steps) });
          throw e;
        }
        return;
      }

      steps = withStep(steps, 'render', { status: 'running', attempts: 1 });
      await updateJob(env, jobId, { steps_json: JSON.stringify(steps) });
      const minimalMp4 = getMinimalMp4Bytes();
      await bucket.put(`${prefix}/final.mp4`, minimalMp4, { httpMetadata: { contentType: 'video/mp4' } });
      steps = withStep(steps, 'render', { status: 'completed' });
      await updateJob(env, jobId, {
        status: 'completed',
        output_final_mp4: `${prefix}/final.mp4`,
        error: null,
        steps_json: JSON.stringify(steps),
      });
    }
  } catch (err) {
    await updateJob(env, jobId, { status: 'failed', error: err.message });
    throw err;
  }
}

async function fetchElevenLabsTTS(apiKey, text, voiceId) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 5000),
      model_id: 'eleven_multilingual_v2',
    }),
  });
  if (!res.ok) {
    let msg = `ElevenLabs: ${res.status}`;
    try {
      const body = await res.text();
      if (body) {
        const o = JSON.parse(body);
        if (o.detail?.message) msg += ` — ${o.detail.message}`;
        else if (o.detail) msg += ` — ${typeof o.detail === 'string' ? o.detail : JSON.stringify(o.detail).slice(0, 100)}`;
      }
    } catch (_) {}
    throw new Error(msg);
  }
  return res.arrayBuffer();
}

function getMinimalPngBytes() {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Minimal valid MP4 (~1KB, single black frame). From https://gist.github.com/dmlap/5643609
function getMinimalMp4Bytes() {
  const base64 =
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTXzg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAhl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAqAAAAAAABAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
