// Use VITE_API_URL if set, otherwise use relative path (works with vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

// Get Twitter connection status
export async function getTwitterStatus(token: string) {
  const res = await fetch(`${API_URL}/api/twitter/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    console.error("Failed to fetch Twitter status:", res.status, res.statusText);
    return {
      connected: false,
      profile: null,
      error: true,
    };
  }
  
  return res.json();
}

// Generate Twitter OAuth URL with userId
export function getTwitterAuthUrl(userId: string): string {
  return `${API_URL}/api/twitter/auth?userId=${encodeURIComponent(userId)}`;
}

// Disconnect Twitter account
export async function disconnectTwitter(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/twitter/disconnect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return res.json();
}

