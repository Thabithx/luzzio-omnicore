import React from 'react';

const PromoTicker = ({ message = " FREE DELIVERY FOR ORDERS ABOVE LKR 10,000" }) => {
   // Duplicate the message to create seamless infinite scroll
   const repeatedMessage = Array(20).fill(message).join('\u2003\u2003\u2003\u2003\u2003\u2003');

   return (
      <div className="fixed top-0 left-0 right-0 w-full bg-black border-b border-white/10 overflow-hidden z-[101]">
         <div className="ticker-wrapper">
            <div className="ticker-content">
               <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                  {repeatedMessage}
               </span>
            </div>
         </div>

         <style dangerouslySetInnerHTML={{
            __html: `
            .ticker-wrapper {
               display: flex;
               width: 100%;
               overflow: hidden;
               position: relative;
               height: 32px;
               align-items: center;
            }

            .ticker-content {
               display: flex;
               animation: scroll 40s linear infinite;
               white-space: nowrap;
            }

            @keyframes scroll {
               0% {
                  transform: translateX(0);
               }
               100% {
                  transform: translateX(-50%);
               }
            }

            .ticker-content:hover {
               animation-play-state: paused;
            }

            @media (max-width: 768px) {
               .ticker-wrapper {
                  height: 28px;
               }
               
               .ticker-content {
                  animation: scroll 30s linear infinite;
               }
            }
         ` }} />
      </div>
   );
};

export default PromoTicker;
