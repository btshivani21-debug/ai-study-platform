import { create } from 'zustand';

interface Video {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number;
  section_id: number;
  locked?: boolean;
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

interface VideoState {
  currentSubject: Subject | null;
  currentVideo: Video | null;
  allVideos: Video[];
  setSubject: (subject: Subject) => void;
  setCurrentVideo: (video: Video) => void;
  getNextVideo: () => Video | null;
  getPrevVideo: () => Video | null;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  currentSubject: null,
  currentVideo: null,
  allVideos: [],

  setSubject: (subject) => {
    const allVideos = subject.sections
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap((s) => s.videos.sort((a, b) => a.order_index - b.order_index));
    set({ currentSubject: subject, allVideos });
  },

  setCurrentVideo: (video) => set({ currentVideo: video }),

  getNextVideo: () => {
    const { currentVideo, allVideos } = get();
    if (!currentVideo) return null;
    const idx = allVideos.findIndex((v) => v.id === currentVideo.id);
    return idx < allVideos.length - 1 ? allVideos[idx + 1] : null;
  },

  getPrevVideo: () => {
    const { currentVideo, allVideos } = get();
    if (!currentVideo) return null;
    const idx = allVideos.findIndex((v) => v.id === currentVideo.id);
    return idx > 0 ? allVideos[idx - 1] : null;
  },
}));
