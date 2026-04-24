// ─── 프로필 ───

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  login_method: string | null;
  credits: number;
  total_credits: number;
  used_this_month: number;
  has_api_key: boolean;
  created_at: string;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로필을 불러올 수 없습니다');
  }
  return res.json();
}

export async function updateProfile(patch: { name?: string; avatar_url?: string }): Promise<void> {
  const res = await fetch('/api/user', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로필 수정에 실패했습니다');
  }
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch('/api/user', { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '계정 삭제에 실패했습니다');
  }
}

// ─── 크레딧 ───

export interface CreditsInfo {
  remaining: number;
  total: number;
  used_this_month: number;
}

export async function fetchCredits(): Promise<CreditsInfo> {
  const res = await fetch('/api/user/credits');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '크레딧 정보를 불러올 수 없습니다');
  }
  return res.json();
}

// ─── API 키 ───

export interface ApiKeyStatus {
  has_key: boolean;
  masked_key: string | null;
}

export async function fetchApiKeyStatus(): Promise<ApiKeyStatus> {
  const res = await fetch('/api/user/api-key');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'API 키 상태를 불러올 수 없습니다');
  }
  return res.json();
}

export async function saveApiKey(apiKey: string): Promise<{ masked_key: string }> {
  const res = await fetch('/api/user/api-key', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'API 키 저장에 실패했습니다');
  }
  const data: { success: boolean; masked_key: string } = await res.json();
  return { masked_key: data.masked_key };
}

export async function deleteApiKey(): Promise<void> {
  const res = await fetch('/api/user/api-key', { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'API 키 삭제에 실패했습니다');
  }
}
