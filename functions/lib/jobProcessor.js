/**
 * MVP job processor: generates script/caption/hashtags and writes placeholder outputs to R2.
 * Replace with real LLM/TTS/FFmpeg pipeline later.
 */

import { generateStoryDraft } from './story.js';
import { updateJob } from './db.js';

const JOBS_PREFIX = 'jobs';

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
    const minimalMp4 = getMinimalMp4Bytes();
    await bucket.put(`${prefix}/final.mp4`, minimalMp4, { httpMetadata: { contentType: 'video/mp4' } });
    const coverPng = getMinimalPngBytes();
    await bucket.put(`${prefix}/cover.png`, coverPng, { httpMetadata: { contentType: 'image/png' } });
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

function getMinimalMp4Bytes() {
  const base64 = 'AAAAGGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAABr9tZGF0AAACrgYFIC/';
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function getMinimalPngBytes() {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export { JOBS_PREFIX };
