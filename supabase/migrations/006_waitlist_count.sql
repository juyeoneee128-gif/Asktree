-- waitlist_count(): 사전 등록자 수 노출 함수
-- security definer로 RLS 우회. 카운트만 반환하므로 이메일 노출 없음.

create or replace function public.waitlist_count()
returns int
language sql
security definer
stable
as $$
  select count(*)::int from public.waitlist
$$;

grant execute on function public.waitlist_count() to anon, authenticated;
