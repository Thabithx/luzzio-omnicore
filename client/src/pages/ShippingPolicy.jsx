import React from 'react';
import Meta from '../components/ui/Meta';

export function ShippingPolicy() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Shipping Policy | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Shipping Policy
            </h1>

            <div className="space-y-16 text-[11px] font-medium leading-relaxed tracking-wide">
               <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest leading-loose max-w-2xl">
                  At Luzzio, we strive to deliver your orders as quickly and efficiently as possible.
                  Our logistics protocol is engineered for speed and total transparency.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="bg-brand-grey p-10 border border-black space-y-8">
                     <div className="space-y-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Shipping Origin</h2>
                        <p className="text-[12px] font-black uppercase">Anuradhapura, Sri Lanka</p>
                        <p className="text-gray-500 italic">All orders are dispatched directly from our center.</p>
                     </div>

                     <div className="space-y-2 pt-4 border-t border-black/10">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Shipping Time</h2>
                        <p className="text-[12px] font-black uppercase">1–3 Business Days</p>
                        <p className="text-gray-500 italic">Expected arrival after the dispatch sequence is initiated.</p>
                     </div>
                  </section>

                  <section className="p-10 border border-black space-y-8">
                     <h2 className="text-[14px] font-black uppercase tracking-widest border-b border-black pb-4">Order Processing</h2>
                     <div className="space-y-6">
                        <div className="flex gap-4">
                           <span className="font-black text-[14px]">/</span>
                           <p>Orders placed <span className="font-black">BEFORE 2 PM</span> are typically processed the same business day.</p>
                        </div>
                        <div className="flex gap-4">
                           <span className="font-black text-[14px]">/</span>
                           <p>Orders placed <span className="font-black">AFTER 2 PM</span> or on public holidays will be processed the following business day.</p>
                        </div>
                     </div>
                  </section>
               </div>

               <section className="py-12 border-t border-gray-100 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-6">
                     <h2 className="text-[14px] font-black uppercase tracking-widest">Digital Tracking Sequence</h2>
                     <p className="text-gray-500 leading-loose">
                        Once your order has been dispatched, you will receive a confirmation message
                        containing your unique tracking details. This allows for real-time monitoring of your acquisition.
                     </p>
                  </div>
                  <div className="w-full md:w-1/3 p-8 bg-black text-white text-center">
                     <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2">Coverage Area</p>
                     <p className="text-[16px] font-black uppercase tracking-tighter italic">Islandwide Delivery</p>
                  </div>
               </section>

               <section className="bg-brand-grey p-8 text-center border-y border-black">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-4">Logistics Inquiry?</p>
                  <p className="text-gray-400">
                     Feel free to contact our customer support team for any questions regarding your shipment protocol.
                  </p>
               </section>
            </div>
         </div>
      </div>
   );
}
