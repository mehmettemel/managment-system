import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  // Redirect if already authenticated
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/');
  }

  return <LoginForm />;
}
