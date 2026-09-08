import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/admin/dashboard');
  const role = session.user.role as string | undefined;
  if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') redirect('/');

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userName={session.user.name ?? ''} role={session.user.role ?? ''} />
      <main className="ml-[280px] flex-1 min-h-screen p-[40px] max-w-[1440px]">
        {children}
      </main>
    </div>
  );
}