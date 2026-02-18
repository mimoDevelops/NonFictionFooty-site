/**
 * Simple story draft generator from niche seed + tone.
 * Returns { headline, story_json, sources_json }.
 * Can be replaced with an LLM later.
 */

const TONES = ['dramatic', 'factual', 'inspiring', 'quirky'];
const TEMPLATES = [
  'The night {subject} changed everything.',
  'Why {subject} still matters today.',
  'The untold story behind {subject}.',
  'From obscurity to glory: {subject}.',
  'The moment that defined {subject}.',
];

function pick(arr, seed) {
  const i = Math.abs(hash(seed)) % arr.length;
  return arr[i];
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return h;
}

function slugToTitle(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function generateStoryDraft(nicheSeed, tone = 'factual', minSlides, maxSlides) {
  const subject = slugToTitle(nicheSeed || 'soccer history');
  const headline = pick(TEMPLATES, nicheSeed + tone).replace('{subject}', subject);
  const slideCount = Math.min(maxSlides || 10, Math.max(minSlides || 3, 3));
  const slides = [];
  for (let i = 0; i < slideCount; i++) {
    slides.push({
      index: i + 1,
      text: `${headline} — Part ${i + 1}. This slide sets up the story. (Replace with real copy from an LLM.)`,
    });
  }
  const story_json = JSON.stringify({ slides, tone });
  const sources_json = JSON.stringify([{ title: headline, url: '#', note: 'Generated draft' }]);
  return { headline, story_json, sources_json, chosen_slide_count: slideCount };
}
