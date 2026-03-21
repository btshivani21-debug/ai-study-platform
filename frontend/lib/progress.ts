import apiClient from './apiClient';

export async function getVideoProgress(videoId: number) {
  const res = await apiClient.get(`/progress/videos/${videoId}`);
  return res.data;
}

export async function updateVideoProgress(
  videoId: number,
  data: { last_position_seconds?: number; is_completed?: boolean }
) {
  const res = await apiClient.post(`/progress/videos/${videoId}`, data);
  return res.data;
}

export async function getSubjectProgress(subjectId: number) {
  const res = await apiClient.get(`/progress/subjects/${subjectId}`);
  return res.data;
}

export async function getProgressOverview() {
  const res = await apiClient.get('/progress/overview');
  return res.data;
}
