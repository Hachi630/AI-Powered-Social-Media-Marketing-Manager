import axios from "axios";

const li = (token: string) =>
  axios.create({
    baseURL: "https://api.linkedin.com",
    headers: { Authorization: `Bearer ${token}` }
  });

export async function getLinkedInMemberId(token: string) {
  const { data } = await li(token).get("/v2/me?projection=(id)");
  return data.id;
}

export async function getLinkedInFollowers(token: string) {
  try {
    const { data } = await li(token).get("/rest/memberFollowersCount", {
      params: { q: "me" },
      headers: { "X-Restli-Protocol-Version": "2.0.0" },
    });

    return data?.elements?.[0]?.followerCount ?? null;
  } catch {
    return null;
  }
}

export async function getTotalConnections(token: string, memberId: string) {
  try {
    const { data } = await li(token).get(
      `/v2/networkSizes/urn:li:person:${memberId}`,
      { params: { edgeType: "MemberFollowedBy" } }
    );

    return data?.value ?? null;
  } catch {
    return null;
  }
}

export function getProfileViews() {
  return null; // LinkedIn does NOT expose this API
}

