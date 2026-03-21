'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import SubjectCard from '@/components/SubjectCard';
import { useAuthStore } from '@/store/authStore';

interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  totalSections: number;
  totalVideos: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    apiClient.get('/subjects')
      .then((res) => setSubjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
        <p className="text-gray-500 mt-2">Browse our collection of learning paths</p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} {...subject} />
          ))}
        </div>
      )}
    </div>
  );
}
