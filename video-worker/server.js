/**
 * External video worker for NonFictionFooty.
 * Deploy to Railway, Render, or any Node host with FFmpeg installed.
 *
 * POST / with body: { jobId, audioUrl, uploadUrl, webhookSecret }
 * - Downloads audio from audioUrl
 * - Runs FFmpeg: static image + audio → MP4
 * - POSTs MP4 to uploadUrl with Authorization: Bearer webhookSecret
 *
 * Requires FFmpeg on PATH (e.g. apt-get install ffmpeg, or Railway/Render buildpack).
 */
import express from 'express';
import { spawn } from 'child_process';
import { createWriteStream, unlinkSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json({ limit: '1mb' }));

// 1x1 black PNG (base64) – used as static image for the video
const BLACK_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PORT = process.env.PORT || 3000;

app.post('/', async (req, res) => {
  const { jobId, audioUrl, uploadUrl, webhookSecret } = req.body || {};
  if (!jobId || !audioUrl || !uploadUrl || !webhookSecret) {
    return res.status(400).json({ error: 'Missing jobId, audioUrl, uploadUrl, or webhookSecret' });
  }

  const id = randomBytes(4).toString('hex');
  const dir = tmpdir();
  const audioPath = join(dir, `audio-${id}.mp3`);
  const imagePath = join(dir, `image-${id}.png`);
  const outPath = join(dir, `out-${id}.mp4`);

  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`Audio fetch: ${audioRes.status}`);
    await pipeline(audioRes.body, createWriteStream(audioPath));

    const imageBuf = Buffer.from(BLACK_PNG_B64, 'base64');
    writeFileSync(imagePath, imageBuf);

    await runFfmpeg(imagePath, audioPath, outPath);

    const mp4Buffer = readFileSync(outPath);
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${webhookSecret}`,
        'Content-Type': 'video/mp4',
      },
      body: mp4Buffer,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload: ${uploadRes.status} ${text}`);
    }
    res.json({ ok: true, jobId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    for (const p of [audioPath, imagePath, outPath]) {
      try { if (existsSync(p)) unlinkSync(p); } catch (_) {}
    }
  }
});

function runFfmpeg(imagePath, audioPath, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-loop', '1', '-i', imagePath,
      '-i', audioPath,
      '-c:v', 'libx264', '-tune', 'stillimage', '-r', '24',
      '-c:a', 'aac', '-shortest', '-pix_fmt', 'yuv420p',
      outPath,
    ];
    const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', (e) => reject(e));
  });
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Video worker listening on ${PORT}`));
