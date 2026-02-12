import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ endTime, message }) => {
   const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
   });

   useEffect(() => {
      const calculateTimeLeft = () => {
         const difference = new Date(endTime) - new Date();
         let timeLeft = {};

         if (difference > 0) {
            timeLeft = {
               days: Math.floor(difference / (1000 * 60 * 60 * 24)),
               hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
               minutes: Math.floor((difference / 1000 / 60) % 60),
               seconds: Math.floor((difference / 1000) % 60)
            };
         } else {
            timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
         }

         return timeLeft;
      };

      const timer = setInterval(() => {
         setTimeLeft(calculateTimeLeft());
      }, 1000);

      // Initial calculation
      setTimeLeft(calculateTimeLeft());

      return () => clearInterval(timer);
   }, [endTime]);

   const addLeadingZero = (num) => (num < 10 ? `0${num}` : num);

   return (
      <div className="w-full bg-black text-white p-6 my-8 border border-white/10 relative overflow-hidden group">
         {/* Subtle background glow */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500" />

         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20">
                  <Timer size={14} className="text-white animate-pulse" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">One Time Offer Protocol</span>
            </div>

            <h3 className="text-sm font-black uppercase tracking-tight leading-none italic">
               {message || "Don't miss out on these great deals"}
            </h3>

            <div className="grid grid-cols-4 gap-2 pt-2">
               {[
                  { value: timeLeft.days, label: 'Days' },
                  { value: timeLeft.hours, label: 'Hrs' },
                  { value: timeLeft.minutes, label: 'Mins' },
                  { value: timeLeft.seconds, label: 'Secs' }
               ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-start gap-1">
                     <div className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums leading-none">
                        {addLeadingZero(item.value)}
                     </div>
                     <div className="text-[8px] font-black uppercase tracking-widest text-white/30">
                        {item.label}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Bottom Progress Indicator (Subtle) */}
         <div className="absolute bottom-0 left-0 h-[1px] bg-white/20 w-full overflow-hidden">
            <div className="h-full bg-white w-1/3 animate-[shimmer_2s_infinite]" style={{
               maskImage: 'linear-gradient(to right, transparent, black, transparent)'
            }} />
         </div>

         <style jsx>{`
            @keyframes shimmer {
               0% { transform: translateX(-100%); }
               100% { transform: translateX(300%); }
            }
         `}</style>
      </div>
   );
};

export default CountdownTimer;
