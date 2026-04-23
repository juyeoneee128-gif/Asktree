import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import { HomeSidebar } from '@/src/components/features/home/HomeSidebar';

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, avatar_url')
    .eq('id', authUser.id)
    .single();

  const user = {
    name: profile?.name ?? '',
    email: profile?.email ?? authUser.email ?? '',
    avatar_url: profile?.avatar_url ?? null,
  };

  return (
    <div className="flex h-full">
      <HomeSidebar user={user} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
