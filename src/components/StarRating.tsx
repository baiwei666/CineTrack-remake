import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, max = 10, size = 16, color = "text-yellow-400" }: { rating: number, max?: number, size?: number, color?: string }) => {
  const stars = [];
  const normalizedRating = (rating / max) * 5; 
  
  for (let i = 1; i <= 5; i++) {
    if (i <= normalizedRating) {
      stars.push(<Star key={i} size={size} className={`${color} fill-current`} />);
    } else if (i - 0.5 <= normalizedRating) {
      stars.push(<div key={i} className="relative"><Star size={size} className="text-gray-600" /><div className="absolute inset-0 overflow-hidden w-1/2"><Star size={size} className={`${color} fill-current`} /></div></div>);
    } else {
      stars.push(<Star key={i} size={size} className="text-gray-600" />);
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

export default StarRating;