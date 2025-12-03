const API_URL = import.meta.env.VITE_API_URL;

export async function getLinkedInMetrics(token: string) {
  const res = await fetch(`${API_URL}/linkedin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const linkedinAuthUrl = `${API_URL}/linkedin/auth`;

