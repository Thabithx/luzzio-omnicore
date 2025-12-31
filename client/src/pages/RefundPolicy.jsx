import React from 'react';
import Meta from '../components/ui/Meta';

export function RefundPolicy() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Refund Policy | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Refund Policy
            </h1>

            <div className="space-y-16 py-12">
               <section className="border-l-4 border-black pl-10 max-w-2xl">
                  <p className="text-[20px] font-black uppercase tracking-tighter leading-none mb-6">All Sales are Final.</p>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-loose">
                     At Luzzio, our commitment to architectural integrity and logistics excellence means that every acquisition is conclusive.
                     We do not offer refunds for any orders once the transaction sequence is initiated.
                  </p>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="bg-brand-grey p-10 border border-black space-y-6">
                     <h2 className="text-[12px] font-black uppercase tracking-[0.3em]">Purchase Protocol</h2>
                     <p className="text-[11px] font-medium leading-relaxed tracking-wider text-black">
                        Please make sure to review your selection carefully—including size, color, and quantity—before
                        checking out. Our digital registry provides total transparency for every component.
                     </p>
                  </section>

                  <section className="p-10 border border-black flex flex-col justify-center items-center text-center space-y-4">
                     <div className="w-12 h-12 bg-black flex items-center justify-center mb-2">
                        <span className="text-white text-[16px] font-black">!</span>
                     </div>
                     <h2 className="text-[12px] font-black uppercase tracking-[0.3em]">Strict Caution</h2>
                     <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Purchase with intentionality. All transactions are absolute.
                     </p>
                  </section>
               </div>

               <section className="pt-20 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-300 animate-pulse">
                     Luzzio Archive Protocol v1.0
                  </p>
               </section>
            </div>
         </div>
      </div>
   );
}
