const API_URL = import.meta.env.VITE_API_URL;

// Bug 3 Fix: Check response status before parsing JSON
export async function getLinkedInMetrics(token: string) {
  const res = await fetch(`${API_URL}/linkedin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    console.error("Failed to fetch LinkedIn metrics:", res.status, res.statusText);
    return {
      followers: { available: false },
      connections: { available: false },
      profileViews: { available: false },
      error: true,
    };
  }
  
  return res.json();
}

// Bug 1 Fix: Function to generate auth URL with userId
export function getLinkedInAuthUrl(userId: string): string {
  return `${API_URL}/linkedin/auth?userId=${encodeURIComponent(userId)}`;
}

// Keep for backwards compatibility, but this should not be used directly
export const linkedinAuthUrl = `${API_URL}/linkedin/auth`;
