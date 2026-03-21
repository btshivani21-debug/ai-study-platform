'use client';

interface ProgressBarProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ProgressBar({ percentage, size = 'md', showLabel = true }: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${
            percentage === 100
              ? 'bg-green-500'
              : percentage > 50
              ? 'bg-indigo-500'
              : 'bg-indigo-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
