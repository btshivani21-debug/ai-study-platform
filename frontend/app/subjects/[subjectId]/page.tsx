'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { getSubjectProgress } from '@/lib/progress';
import { useAuthStore } from '@/store/authStore';
import ProgressBar from '@/components/ProgressBar';

interface Video {
  id: number;
  title: string;
  order_index: number;
  duration_seconds: number;
  locked: boolean;
  progress?: {
    is_completed: boolean;
    last_position_seconds: number;
  };
}

interface Section {
  id: number;
  title: string;
  order_index: number;
  videos: Video[];
}

interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  sections: Section[];
}

interface ProgressEntry {
  video_id: number;
  is_completed: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = Number(params.subjectId);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<number>>(new Set());
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<Set<number>>(new Set());
  const [progressPercentage, setProgressPercentage] = useState(0);

  const computeUnlockedVideos = useCallback((allVids: Video[], completed: Set<number>) => {
    const unlocked = new Set<number>();
    for (let i = 0; i < allVids.length; i++) {
      if (i === 0) {
        unlocked.add(allVids[i].id);
      } else if (completed.has(allVids[i - 1].id)) {
        unlocked.add(allVids[i].id);
      }
    }
    return unlocked;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isAuthenticated) {
          router.push('/auth/login');
          return;
        }

        const res = await apiClient.get(`/subjects/${subjectId}/tree`);
        setSubject(res.data);

        const allVids = res.data.sections
          .sort((a: Section, b: Section) => a.order_index - b.order_index)
          .flatMap((s: Section) => s.videos.sort((a: Video, b: Video) => a.order_index - b.order_index));

        const unlockedFromServer = new Set<number>(
          allVids.filter((video: Video) => !video.locked).map((video: Video) => video.id)
        );
        setUnlockedVideoIds(unlockedFromServer);

        const progressRes = await getSubjectProgress(subjectId);
        const completed = new Set<number>(
          (progressRes.progress || [])
            .filter((p: ProgressEntry) => p.is_completed)
            .map((p: ProgressEntry) => p.video_id)
        );
        setCompletedVideoIds(completed);
        setProgressPercentage(progressRes.percentage || 0);
      } catch (err) {
        console.error('Failed to load subject:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [subjectId, isAuthenticated, authLoading, computeUnlockedVideos, router]);

  const handleVideoClick = (videoId: number) => {
    if (unlockedVideoIds.has(videoId)) {
      router.push(`/subjects/${subjectId}/video/${videoId}`);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Subject not found</p>
      </div>
    );
  }

  const totalVideos = subject.sections.reduce((acc, s) => acc + s.videos.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/subjects')}
          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {subject.thumbnail && (
            <img
              src={subject.thumbnail}
              alt={subject.title}
              className="w-full sm:w-48 aspect-video object-cover rounded-xl"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{subject.title}</h1>
            <p className="text-gray-500 mb-4">{subject.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <span>{subject.sections.length} sections</span>
              <span>{totalVideos} videos</span>
            </div>
            {isAuthenticated && (
              <div className="max-w-xs">
                <ProgressBar percentage={progressPercentage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {subject.sections
          .sort((a, b) => a.order_index - b.order_index)
          .map((section) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
                <p className="text-xs text-gray-400 mt-1">{section.videos.length} videos</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {section.videos
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((video) => {
                    const isCompleted = completedVideoIds.has(video.id);
                    const isUnlocked = unlockedVideoIds.has(video.id);

                    return (
                      <li key={video.id}>
                        <button
                          onClick={() => handleVideoClick(video.id)}
                          disabled={!isUnlocked}
                          className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-colors ${
                            isUnlocked
                              ? 'hover:bg-indigo-50 cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : isUnlocked ? (
                              <div className="w-8 h-8 rounded-full border-2 border-indigo-300 flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDuration(video.duration_seconds)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
