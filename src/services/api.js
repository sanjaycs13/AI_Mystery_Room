const base = import.meta.env.VITE_API_BASE_URL || '/api';
export async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Something went wrong. Please try again.');
  return body.data;
}
export const createCase = (data) => request('/cases/generate', { method: 'POST', body: JSON.stringify(data) });
export const getCase = (id) => request(`/cases/${id}`);
export const startInvestigation = (id) => request(`/cases/${id}/investigations`, { method: 'POST', body: '{}' });
export const updateProgress = (id, openedEvidenceIds) => request(`/investigations/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ openedEvidenceIds }) });
export const submitAccusation = (id, suspectId) => request(`/investigations/${id}/accusations`, { method: 'POST', body: JSON.stringify({ suspectId }) });
export const getResult = (id) => request(`/investigations/${id}/result`);
