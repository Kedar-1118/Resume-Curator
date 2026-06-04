import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// ─── Auth ────────────────────────────────────────────────────
export const getMe = () => API.get('/auth/me').then((res) => res.data);
export const logout = () => API.post('/auth/logout').then((res) => res.data);

// ─── Resume CRUD ─────────────────────────────────────────────
export const getResumes = () => API.get('/resume').then((res) => res.data);
export const getResume = (id) => API.get(`/resume/${id}`).then((res) => res.data);
export const createResume = (data) => API.post('/resume', data).then((res) => res.data);
export const updateResume = (id, data) => API.put(`/resume/${id}`, data).then((res) => res.data);
export const deleteResume = (id) => API.delete(`/resume/${id}`).then((res) => res.data);
export const duplicateResume = (id) => API.post(`/resume/${id}/duplicate`).then((res) => res.data);

// ─── AI ──────────────────────────────────────────────────────
export const getATSScore = (data) => API.post('/ai/score', data).then((res) => res.data);
export const getKeywords = (data) => API.post('/ai/keywords', data).then((res) => res.data);
export const rewriteBullet = (data) => API.post('/ai/rewrite', data).then((res) => res.data);
export const generateSummary = (data) => API.post('/ai/summary', data).then((res) => res.data);
export const improveResume = (data) => API.post('/ai/improve', data).then((res) => res.data);
export const scoreMultiJD = (data) => API.post('/ai/score-multi', data).then((res) => res.data);
export const generateCoverLetter = (data) => API.post('/ai/cover-letter', data).then((res) => res.data);

// ─── Resume Parsing (file upload) ────────────────────────────
export const parseResumeFile = (file, hint) => {
  const formData = new FormData();
  formData.append('resume', file);
  if (hint) formData.append('hint', hint);
  return API.post('/ai/parse-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};

// ─── Standalone ATS Score (file upload + optional JD) ────────
export const scoreUploadedResume = (file, jobDescription) => {
  const formData = new FormData();
  formData.append('resume', file);
  if (jobDescription?.trim()) {
    formData.append('jobDescription', jobDescription.trim());
  }
  return API.post('/ai/score-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};

// ─── Version History (Feature 4) ─────────────────────────────
export const getVersions = (id) => API.get(`/resume/${id}/versions`).then((res) => res.data);
export const getVersionSnapshot = (id, index) => API.get(`/resume/${id}/versions/${index}`).then((res) => res.data);

// ─── JD Targets (Feature 6) ─────────────────────────────────
export const addJDTarget = (id, data) => API.post(`/resume/${id}/jd-targets`, data).then((res) => res.data);
export const removeJDTarget = (id, index) => API.delete(`/resume/${id}/jd-targets/${index}`).then((res) => res.data);

// ─── Export ──────────────────────────────────────────────────
export const exportPDF = (data) => API.post('/export/pdf', data, { responseType: 'blob' });
export const exportDOCX = (data) => API.post('/export/docx', data, { responseType: 'blob' });
export const exportCoverLetterDOCX = (id) => API.get(`/export/${id}/cover-letter/docx`, { responseType: 'blob' });

// ─── GitHub (Feature 1) ─────────────────────────────────────
export const disconnectGithub = () => API.delete('/auth/github/disconnect').then((res) => res.data);
export const ingestGithubRepos = () => API.post('/github/ingest').then((res) => res.data);
export const getGithubIngestStatus = () => API.get('/github/ingest/status').then((res) => res.data);
export const generateGithubProjects = (data) => API.post('/github/generate-projects', data).then((res) => res.data);

export default API;
