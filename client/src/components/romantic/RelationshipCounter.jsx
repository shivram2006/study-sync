import React, { useState, useEffect } from 'react';
import { calculateRelationshipTime } from '../../utils/dateUtils';
import { romanticConfig } from '../../utils/romanticConfig';
import { Sparkles, Heart } from 'lucide-react';

export const RelationshipCounter = ({ startDate, customQuote }) => {
  const [time, setTime] = useState(() =>
    calculateRelationshipTime(startDate || romanticConfig.relationshipStartDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateRelationshipTime(startDate || romanticConfig.relationshipStartDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  if (!time) return null;

  return (
    <div className="bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-rose-50/80 border border-rose-100 rounded-2xl p-3.5 mb-4 shadow-2xs text-center relative overflow-hidden">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-rose-600 uppercase tracking-widest mb-1.5">
        <Heart size={12} className="fill-rose-500 text-rose-500" />
        <span>Together Forever</span>
        <Sparkles size={12} className="text-amber-500" />
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 my-1">
        <div className="text-center px-2 py-1 rounded-xl bg-white/80 border border-rose-100 shadow-2xs min-w-[50px]">
          <span className="block text-lg sm:text-xl font-bold font-serif-romantic text-stone-900 leading-tight">
            {time.days}
          </span>
          <span className="text-[10px] text-stone-500 font-medium uppercase">Days</span>
        </div>

        <span className="text-rose-400 font-bold">:</span>

        <div className="text-center px-2 py-1 rounded-xl bg-white/80 border border-rose-100 shadow-2xs min-w-[45px]">
          <span className="block text-lg sm:text-xl font-bold font-serif-romantic text-stone-900 leading-tight">
            {String(time.hours).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-stone-500 font-medium uppercase">Hours</span>
        </div>

        <span className="text-rose-400 font-bold">:</span>

        <div className="text-center px-2 py-1 rounded-xl bg-white/80 border border-rose-100 shadow-2xs min-w-[45px]">
          <span className="block text-lg sm:text-xl font-bold font-serif-romantic text-stone-900 leading-tight">
            {String(time.minutes).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-stone-500 font-medium uppercase">Mins</span>
        </div>

        <span className="text-rose-400 font-bold">:</span>

        <div className="text-center px-2 py-1 rounded-xl bg-white/80 border border-rose-100 shadow-2xs min-w-[45px]">
          <span className="block text-lg sm:text-xl font-bold font-serif-romantic text-stone-900 leading-tight">
            {String(time.seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-stone-500 font-medium uppercase">Secs</span>
        </div>
      </div>

      <p className="text-xs italic text-stone-500 mt-2 font-serif-romantic max-w-md mx-auto line-clamp-1">
        "{customQuote || romanticConfig.headerQuote}"
      </p>
    </div>
  );
};
