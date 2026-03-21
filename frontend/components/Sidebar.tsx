'use client';

interface SidebarProps {
  subject: {
    id: number;
    title: string;
    sections: {
      id: number;
      title: string;
      order_index: number;
      videos: {
        id: number;
        title: string;
        order_index: number;
        duration_seconds: number;
      }[];
    }[];
  };
  currentVideoId?: number;
  completedVideoIds: Set<number>;
  unlockedVideoIds: Set<number>;
  onVideoSelect: (videoId: number) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Sidebar({ subject, currentVideoId, completedVideoIds, unlockedVideoIds, onVideoSelect }: SidebarProps) {
  return (
    <div className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">{subject.title}</h2>
      </div>
      <div className="py-2">
        {subject.sections
          .sort((a, b) => a.order_index - b.order_index)
          .map((section) => (
            <div key={section.id} className="mb-1">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <ul>
                {section.videos
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((video) => {
                    const isCompleted = completedVideoIds.has(video.id);
                    const isUnlocked = unlockedVideoIds.has(video.id);
                    const isCurrent = video.id === currentVideoId;

                    return (
                      <li key={video.id}>
                        <button
                          onClick={() => isUnlocked && onVideoSelect(video.id)}
                          disabled={!isUnlocked}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            isCurrent
                              ? 'bg-indigo-50 border-r-2 border-indigo-600'
                              : isUnlocked
                              ? 'hover:bg-gray-50'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : isUnlocked ? (
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isCurrent ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                              }`}>
                                {isCurrent && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${
                              isCurrent ? 'font-medium text-indigo-700' : 'text-gray-700'
                            }`}>
                              {video.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDuration(video.duration_seconds)}
                            </p>
                          </div>
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
