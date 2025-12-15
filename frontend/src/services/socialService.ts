// Use VITE_API_URL if set, otherwise use relative path (works with vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

// Get Facebook connection status
export async function getFacebookStatus(token: string) {
  const res = await fetch(`${API_URL}/api/social/facebook/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    console.error("Failed to fetch Facebook status:", res.status, res.statusText);
    return {
      connected: false,
      debug: null,
      error: true,
    };
  }
  
  return res.json();
}

// Get Instagram connection status
export async function getInstagramStatus(token: string) {
  const res = await fetch(`${API_URL}/api/social/instagram/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    console.error("Failed to fetch Instagram status:", res.status, res.statusText);
    return {
      connected: false,
      error: true,
    };
  }
  
  return res.json();
}

// Generate Facebook OAuth URL (for Facebook sharing only)
export async function getFacebookAuthUrl(token: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/social/facebook/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const error = await res.json();
    return {
      success: false,
      error: error.message || 'Failed to get Facebook auth URL',
    };
  }
  
  return res.json();
}

// Generate Instagram OAuth URL (requires Facebook Page, includes business_management)
export async function getInstagramAuthUrl(token: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/social/instagram/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const error = await res.json();
    return {
      success: false,
      error: error.message || 'Failed to get Instagram auth URL',
    };
  }
  
  return res.json();
}

// Disconnect Facebook account
export async function disconnectFacebook(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/social/facebook/disconnect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const error = await res.json();
    return {
      success: false,
      error: error.message || 'Failed to disconnect Facebook account',
    };
  }
  
  return res.json();
}

// Disconnect Instagram account
export async function disconnectInstagram(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/social/instagram/disconnect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const error = await res.json();
    return {
      success: false,
      error: error.message || 'Failed to disconnect Instagram account',
    };
  }
  
  return res.json();
}

