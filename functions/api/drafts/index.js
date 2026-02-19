// Stub: old "Drafts" UI called GET /api/drafts. Return empty list so it gets valid JSON.
// New app uses /api/jobs and the Library page.
export async function onRequestGet() {
  return Response.json({ drafts: [] });
}
