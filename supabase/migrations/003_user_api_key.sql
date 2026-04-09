-- Tier 6: 사용자 API 키 암호화 저장
-- Node.js AES-256-GCM으로 암호화된 문자열을 저장

ALTER TABLE public.users
  ADD COLUMN encrypted_api_key TEXT;
