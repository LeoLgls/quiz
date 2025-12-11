'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';

export function useAuth(requireAuth: boolean = false, requireRole?: 'TEACHER' | 'STUDENT') {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (requireRole && user && user.role !== requireRole) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, requireAuth, requireRole, router]);

  return { user, isLoading, isAuthenticated };
}
