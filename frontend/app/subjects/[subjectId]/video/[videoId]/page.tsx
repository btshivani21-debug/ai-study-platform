'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { getVideoProgress, updateVideoProgress, getSubjectProgress } from '@/lib/progress';
import { useAuthStore } from '@/store/authStore';
import { useVideoStore } from '@/store/videoStore';
import Sidebar from '@/components/Sidebar';
import VideoPlayer from '@/components/VideoPlayer';

interface Video {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number;
  section_id: number;
  locked: boolean;
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
  last_position_seconds: number;
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = Number(params.subjectId);
  const videoId = Number(params.videoId);

  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { setSubject, setCurrentVideo, getNextVideo, getPrevVideo, currentSubject, allVideos } = useVideoStore();

  const [subject, setSubjectState] = useState<Subject | null>(null);
  const [currentVid, setCurrentVid] = useState<Video | null>(null);
  const [startPosition, setStartPosition] = useState(0);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<number>>(new Set());
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const computeUnlockedVideos = useCallback((allVids: Array<{ id: number }>, completed: Set<number>) => {
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
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const subjectRes = await apiClient.get(`/subjects/${subjectId}/tree`);
        const subjectData: Subject = subjectRes.data;
        setSubjectState(subjectData);
        setSubject(subjectData);

        // Get all videos flat
        const allVids = subjectData.sections
          .sort((a, b) => a.order_index - b.order_index)
          .flatMap((s) => s.videos.sort((a, b) => a.order_index - b.order_index));

        // Get progress
        const progressRes = await getSubjectProgress(subjectId);
        const completed = new Set<number>(
          (progressRes.progress || [])
            .filter((p: ProgressEntry) => p.is_completed)
            .map((p: ProgressEntry) => p.video_id)
        );
        setCompletedVideoIds(completed);

        const unlocked = new Set<number>(
          allVids.filter((video) => !video.locked).map((video) => video.id)
        );
        setUnlockedVideoIds(unlocked);

        // Find current video
        const video = allVids.find((v) => v.id === videoId);
        if (video) {
          setCurrentVid(video);
          setCurrentVideo(video);

          // Get video progress
          const vidProgress = await getVideoProgress(videoId);
          setStartPosition(vidProgress.last_position_seconds || 0);
        }
      } catch (err) {
        console.error('Failed to load video page:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId, videoId, isAuthenticated, authLoading, router, setSubject, setCurrentVideo, computeUnlockedVideos]);

  const handleProgress = useCallback(async (currentTime: number) => {
    try {
      await updateVideoProgress(videoId, { last_position_seconds: currentTime });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [videoId]);

  const handleVideoEnd = useCallback(async () => {
    try {
      await updateVideoProgress(videoId, { is_completed: true, last_position_seconds: 0 });

      // Update completed set
      setCompletedVideoIds((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        // Recompute unlocked to instantly unlock next video in UI
        if (allVideos.length > 0) {
          setUnlockedVideoIds(computeUnlockedVideos(allVideos, next));
        }
        return next;
      });

      // Auto-play next
      const nextVideo = getNextVideo();
      if (nextVideo) {
        router.push(`/subjects/${subjectId}/video/${nextVideo.id}`);
      }
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  }, [videoId, subjectId, router, getNextVideo, allVideos, computeUnlockedVideos]);

  const handleVideoSelect = (vid: number) => {
    router.push(`/subjects/${subjectId}/video/${vid}`);
  };

  const prevVideo = currentSubject ? getPrevVideo() : null;
  const nextVideo = currentSubject ? getNextVideo() : null;

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!subject || !currentVid) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Video not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block overflow-y-auto">
        <Sidebar
          subject={subject}
          currentVideoId={videoId}
          completedVideoIds={completedVideoIds}
          unlockedVideoIds={unlockedVideoIds}
          onVideoSelect={handleVideoSelect}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <VideoPlayer
            youtubeUrl={currentVid.youtube_url}
            startAt={startPosition}
            onProgress={handleProgress}
            onEnd={handleVideoEnd}
          />

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-gray-900">{currentVid.title}</h1>
            {currentVid.description && (
              <p className="text-gray-500 mt-3 leading-relaxed">{currentVid.description}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {prevVideo ? (
              <button
                onClick={() => router.push(`/subjects/${subjectId}/video/${prevVideo.id}`)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous: {prevVideo.title}
              </button>
            ) : <div />}

            {nextVideo && unlockedVideoIds.has(nextVideo.id) ? (
              <button
                onClick={() => router.push(`/subjects/${subjectId}/video/${nextVideo.id}`)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
              >
                Next: {nextVideo.title}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : nextVideo ? (
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Next: {nextVideo.title} (Locked)
              </span>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
