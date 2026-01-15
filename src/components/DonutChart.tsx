import React from 'react';

const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  if (total === 0) return <div className="text-gray-500 text-sm flex justify-center items-center h-40">暂无数据</div>;

  return (
    <div className="relative w-56 h-56 md:w-64 md:h-64 mx-auto">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;

          currentOffset += percentage * circumference;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt" // Use butt to avoid overlapping confusion on small segments, or 'round' for style
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-sm">{total}</span>
        <span className="text-xs text-slate-500 font-medium">看过的影片</span>
      </div>
    </div>
  );
};

export default DonutChart;