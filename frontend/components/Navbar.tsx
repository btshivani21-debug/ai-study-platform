'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LearnHub</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <Link href="/subjects" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium">
              Courses
            </Link>
            {isAuthenticated && (
              <Link href="/profile" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium">
                My Progress
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 hidden sm:inline">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
