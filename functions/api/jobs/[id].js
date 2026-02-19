import { getJobById, updateJob } from '../../lib/db.js';
import { runJob } from '../../lib/jobProcessor.js';

const BASE_URL = 'https://nonfictionfooty-site.pages.dev';

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;
  const { job } = await getJobById(env, id);
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
  if (job.status === 'pending') {
    try {
      await runJob(env, id, job);
      const { job: updated } = await getJobById(env, id);
      return Response.json(formatJobResponse(env, updated));
    } catch (err) {
      const { job: failed } = await getJobById(env, id);
      return Response.json(formatJobResponse(env, failed));
    }
  }
  return Response.json(formatJobResponse(env, job));
}

function formatJobResponse(env, job) {
  const base = `${BASE_URL}/api/jobs/${job.id}`;
  const out = {
    jobId: job.id,
    status: job.status,
    created_at: job.created_at,
    topic: job.topic,
    team_or_player: job.team_or_player,
    era_or_match: job.era_or_match,
    tone: job.tone,
    duration_sec: job.duration_sec,
    style_preset: job.style_preset,
    caption: job.caption,
    hashtags: job.hashtags,
    error: job.error,
  };
  if (job.status === 'completed') {
    out.downloadUrls = {
      mp4: `${base}/download`,
      captions: job.output_captions_json ? `${base}/asset/captions` : null,
      srt: job.output_subtitles_srt ? `${base}/asset/srt` : null,
      cover: job.output_cover_png ? `${base}/asset/cover` : null,
    };
  }
  return out;
}
