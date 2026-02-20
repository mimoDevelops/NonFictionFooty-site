/**
 * Job processor: script + optional TTS (ElevenLabs) + placeholder or external video worker.
 * When ELEVENLABS_API_KEY is set, generates audio and stores at jobs/{id}/audio.mp3.
 * When EXTERNAL_VIDEO_WORKER_URL + WEBHOOK_SECRET are set, invokes external worker to build real MP4 and upload via /upload-video.
 */

import { generateStoryDraft } from './story.js';
import { updateJob } from './db.js';

const JOBS_PREFIX = 'jobs';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const BASE_URL = 'https://nonfictionfooty-site.pages.dev';

export async function runJob(env, jobId, job) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error('R2 not configured');
  const prefix = `${JOBS_PREFIX}/${jobId}`;
  try {
    await updateJob(env, jobId, { status: 'processing' });
    const topic = job.topic || 'soccer';
    const tone = job.tone || 'factual';
    const story = generateStoryDraft(topic, tone, 3, 10);
    const caption = story.headline;
    const hashtags = '#soccer #football #NonFictionFooty #story';
    const script = { slides: JSON.parse(story.story_json || '{}').slides || [], durationSec: job.duration_sec || 45 };
    const captionsJson = JSON.stringify({ caption, hashtags, script });
    await bucket.put(`${prefix}/captions.json`, new TextEncoder().encode(captionsJson), { httpMetadata: { contentType: 'application/json' } });
    const srt = '1\n00:00:00,000 --> 00:00:05,000\n' + (caption || '') + '\n';
    await bucket.put(`${prefix}/subtitles.srt`, new TextEncoder().encode(srt), { httpMetadata: { contentType: 'application/x-subrip' } });
    const coverPng = getMinimalPngBytes();
    await bucket.put(`${prefix}/cover.png`, coverPng, { httpMetadata: { contentType: 'image/png' } });

    let audioStored = false;
    const scriptText = (script.slides || []).map((s) => s.text).join(' ') || caption;
    if (env.ELEVENLABS_API_KEY && scriptText) {
      try {
        const audioBytes = await fetchElevenLabsTTS(env.ELEVENLABS_API_KEY, scriptText, env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID);
        if (audioBytes && audioBytes.byteLength > 0) {
          await bucket.put(`${prefix}/audio.mp3`, audioBytes, { httpMetadata: { contentType: 'audio/mpeg' } });
          audioStored = true;
        }
      } catch (e) {
        console.error('TTS failed:', e.message);
      }
    }

    const useExternalVideo = env.EXTERNAL_VIDEO_WORKER_URL && env.WEBHOOK_SECRET;
    if (useExternalVideo && audioStored) {
      await updateJob(env, jobId, {
        script_json: JSON.stringify(script),
        caption,
        hashtags,
        output_captions_json: `${prefix}/captions.json`,
        output_subtitles_srt: `${prefix}/subtitles.srt`,
        output_cover_png: `${prefix}/cover.png`,
        error: null,
      });
      const audioUrl = `${BASE_URL}/api/jobs/${jobId}/asset/audio`;
      const uploadUrl = `${BASE_URL}/api/jobs/${jobId}/upload-video`;
      try {
        await fetch(env.EXTERNAL_VIDEO_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            audioUrl,
            uploadUrl,
            webhookSecret: env.WEBHOOK_SECRET,
          }),
        });
      } catch (e) {
        await updateJob(env, jobId, { status: 'failed', error: `External worker: ${e.message}` });
        throw e;
      }
      return;
    }

    const minimalMp4 = getMinimalMp4Bytes();
    await bucket.put(`${prefix}/final.mp4`, minimalMp4, { httpMetadata: { contentType: 'video/mp4' } });
    await updateJob(env, jobId, {
      status: 'completed',
      script_json: JSON.stringify(script),
      caption,
      hashtags,
      output_final_mp4: `${prefix}/final.mp4`,
      output_captions_json: `${prefix}/captions.json`,
      output_subtitles_srt: `${prefix}/subtitles.srt`,
      output_cover_png: `${prefix}/cover.png`,
      error: null,
    });
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
  if (!res.ok) throw new Error(`ElevenLabs: ${res.status}`);
  return res.arrayBuffer();
}

// Minimal valid MP4 (~1KB, single black frame, plays in browser). From https://gist.github.com/dmlap/5643609
function getMinimalMp4Bytes() {
  const base64 =
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTXzg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAhl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAqAAAAAAABAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function getMinimalPngBytes() {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export { JOBS_PREFIX };
