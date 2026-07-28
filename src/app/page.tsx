import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export default async function Home() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  redirect(isAdminRole(session.user.role) ? '/admin' : '/team');
}
