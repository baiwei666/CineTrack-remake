import React, { useMemo } from 'react';

interface YearlyHeatmapProps {
    year: number;
    data: Record<string, number>;
}

export default function YearlyHeatmap({ year, data }: YearlyHeatmapProps) {
    // Generate all days for the year
    const days = useMemo(() => {
        const d = [];
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            d.push(new Date(dt));
        }
        return d;
    }, [year]);

    // Group by month
    const months = Array.from({ length: 12 }, (_, i) => {
        return days.filter(d => d.getMonth() === i);
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((monthDays, midx) => (
                <div key={midx} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 mb-1">{midx + 1}月</span>
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty slots for start of month */}
                        {Array.from({ length: monthDays[0].getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

                        {monthDays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const count = data[dateStr] || 0;
                            let bg = 'bg-gray-100 dark:bg-slate-800';
                            if (count > 0) bg = 'bg-blue-200 dark:bg-blue-900';
                            if (count > 1) bg = 'bg-blue-400 dark:bg-blue-700';
                            if (count > 2) bg = 'bg-blue-600 dark:bg-blue-500';

                            return (
                                <div
                                    key={dateStr}
                                    title={`${dateStr}: ${count} 部`}
                                    className={`w-full aspect-square rounded-sm ${bg} transition hover:scale-125`}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
