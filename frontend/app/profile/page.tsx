'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getProgressOverview } from '@/lib/progress';
import ProgressBar from '@/components/ProgressBar';

interface SubjectProgress {
  subjectId: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  totalVideos: number;
  completedVideos: number;
  percentage: number;
}

interface Overview {
  totalVideos: number;
  totalCompleted: number;
  overallPercentage: number;
  subjects: SubjectProgress[];
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    getProgressOverview()
      .then(setOverview)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{overview.totalCompleted}</p>
              <p className="text-xs text-gray-500 mt-1">Videos Completed</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{overview.totalVideos}</p>
              <p className="text-xs text-gray-500 mt-1">Total Videos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{overview.overallPercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">Overall Progress</p>
            </div>
          </div>
        )}
      </div>

      {/* Course progress */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Course Progress</h2>
      {overview && overview.subjects.length > 0 ? (
        <div className="space-y-4">
          {overview.subjects.map((subject) => (
            <Link key={subject.subjectId} href={`/subjects/${subject.subjectId}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  {subject.thumbnail ? (
                    <img
                      src={subject.thumbnail}
                      alt={subject.title}
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">{subject.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{subject.title}</h3>
                    <p className="text-xs text-gray-400">
                      {subject.completedVideos} of {subject.totalVideos} videos completed
                    </p>
                  </div>
                  {subject.percentage === 100 && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <ProgressBar percentage={subject.percentage} size="sm" showLabel={false} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">You haven&apos;t started any courses yet.</p>
          <Link
            href="/subjects"
            className="text-indigo-600 hover:underline font-medium text-sm"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
