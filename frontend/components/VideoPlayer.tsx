'use client';

import { useRef, useCallback } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';

interface VideoPlayerProps {
  youtubeUrl: string;
  startAt?: number;
  onProgress?: (currentTime: number) => void;
  onEnd?: () => void;
}

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

export default function VideoPlayer({ youtubeUrl, startAt = 0, onProgress, onEnd }: VideoPlayerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const videoId = extractVideoId(youtubeUrl);

  const onReady = useCallback((event: YouTubeEvent) => {
    playerRef.current = event.target;
    if (startAt > 0) {
      event.target.seekTo(startAt, true);
    }
  }, [startAt]);

  const onStateChange = useCallback((event: YouTubeEvent<number>) => {
    // Playing
    if (event.data === 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = Math.floor(playerRef.current.getCurrentTime());
          onProgress?.(currentTime);
        }
      }, 10000); // every 10 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Ended
    if (event.data === 0) {
      onEnd?.();
    }
  }, [onProgress, onEnd]);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-gray-400">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden">
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
