import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { Link } from 'react-router-dom';
import Meta from '../components/ui/Meta';
import { motion } from 'framer-motion';
import api from '../services/api';
import { cn } from '../utils/cn';

// Import brand assets
import heroImg from '../assets/hero.jpg';
import bootsImg from '../assets/boots.png';
import hoodieCat from '../assets/hoodie.jpg';
import bootCat from '../assets/boot.jpg';
import bagsImg from '../assets/bags.jpg';

export function Home() {
   const [products, setProducts] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchProducts = async () => {
         try {
            const res = await api.get('/products');
            setProducts(res.data.data.slice(0, 4));
         } catch (err) {
            // Error feedback handled via UI/Meta
         } finally {
            setLoading(false);
         }
      };
      fetchProducts();
   }, []);

   return (
      <div className="min-h-screen bg-white">
         <Meta title="Luxury Redefined" description="Explore the Luzzio collection. High-fashion minimalist luxury." />

         {/* SECTION 1: HERO - READY TO WEAR */}
         <section className="relative h-screen overflow-hidden group">
            <img
               src={heroImg}
               alt="Spring 26 Collection"
               className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute inset-x-0 bottom-20 flex flex-col items-center space-y-8 z-10 px-10 text-center">
               <div className="space-y-2">
                  <h2 className="text-white text-base md:text-xl font-black uppercase tracking-[0.6em]">Ready-to-Wear</h2>
                  <p className="text-white/70 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em]">Spring 26 Collection</p>
               </div>
               <div className="flex gap-4">
                  <Link to="/products">
                     <button className="px-10 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white border border-black transition-all duration-500">
                        Shop
                     </button>
                  </Link>
               </div>
            </div>
         </section>

         {/* SECTION 2: BRAND INTERSTITIAL */}
         <section className="h-[60vh] md:h-[70vh] flex items-center justify-center bg-brand-grey relative overflow-hidden border-b border-black">
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <h2 className="text-[25vw] md:text-[20vw] font-black uppercase tracking-[-0.05em] text-black/[0.03] leading-none px-10">LUZZIO</h2>
            </div>
            <div className="relative text-center space-y-8 md:space-y-12 max-w-2xl px-6 md:px-10">
               <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-[0.9] md:leading-tight">
                  Uncompromising <br className="md:hidden" /> Modernity.
               </h3>
               <Link to="/products" className="inline-block text-[10px] font-black uppercase tracking-[0.3em] border-b border-black pb-2 hover:opacity-50">
                  Discover Now
               </Link>
            </div>
         </section>

         {/* SELECTED ARCHIVE GRID - MOVED TO TOP */}
         <section className="bg-white border-b border-black">
            <div className="flex flex-col items-center text-center py-12 md:py-24 bg-brand-grey border-b border-black">
               <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.4em]">Selected Archives</h2>
               <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-4 md:mt-6 italic">Winter 25/26 Collection</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
               {loading ? (
                  Array(4).fill(0).map((_, i) => (
                     <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                  ))
               ) : (
                  products.map((product, idx) => (
                     <div key={product._id} className={cn(
                        "border-black",
                        "border-b md:border-b-0",
                        idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                        idx % 4 === 3 ? "md:border-r-0" : ""
                     )}>
                        <ProductCard product={product} />
                     </div>
                  ))
               )}
            </div>
            <div className="py-10 flex justify-center bg-brand-grey">
               <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                  View Full Archive
               </Link>
            </div>
         </section>

         {/* REFINED CATEGORY BOXES - ASSET INTEGRATION */}
         <section className="flex flex-col">
            {/* CATEGORY 1: READY-TO-WEAR */}
            <div className="relative aspect-square md:h-screen w-full flex items-end justify-center group overflow-hidden border-b border-black bg-white">
               <img
                  src={hoodieCat}
                  alt="Ready to Wear"
                  className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="relative w-full pb-4 md:pb-12 flex flex-col items-center space-y-2 md:px-6">
                  <h4 className="text-black text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-center">Ready-to-Wear</h4>
                  <Link to="/products?category=ready-to-wear">
                     <button className="px-8 md:px-12 py-1.5 border border-black text-black text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all">
                        Shop Men
                     </button>
                  </Link>
               </div>
            </div>

            {/* CATEGORY 2: BAGS / ARCHIVE */}
            <div className="relative aspect-square md:h-screen w-full flex items-end justify-center group overflow-hidden border-b border-black">
               <img
                  src={bagsImg}
                  alt="Leather Archive"
                  className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="relative w-full pb-4 md:pb-12 flex flex-col items-center space-y-2 md:px-6">
                  <h4 className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] drop-shadow-md text-center">Bags & Archive</h4>
                  <Link to="/products?category=accessories">
                     <button className="px-8 md:px-12 py-1.5 bg-white/90 backdrop-blur-sm border border-black text-black text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all">
                        Shop Now
                     </button>
                  </Link>
               </div>
            </div>

            {/* CATEGORY 3: FOOTWEAR */}
            <div className="relative aspect-square md:h-screen w-full flex items-end justify-center group overflow-hidden border-b border-black bg-white">
               <img
                  src={bootCat}
                  alt="Footwear Collection"
                  className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="relative w-full pb-4 md:pb-12 flex flex-col items-center space-y-2 md:px-6">
                  <h4 className="text-black text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-center">Footwear</h4>
                  <Link to="/products?category=footwear">
                     <button className="px-8 md:px-12 py-1.5 border border-black text-black text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all">
                        Shop Archive
                     </button>
                  </Link>
               </div>
            </div>
         </section>

         {/* INTERSTITIAL SECTION */}
         <section className="py-32 md:py-40 bg-white flex flex-col items-center justify-center space-y-12 text-center px-6 md:px-10 border-t border-black">
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Corporate Excellence</p>
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Sustainability & Ethics</h2>
            </div>
            <p className="max-w-xl text-xs md:text-sm text-gray-600 font-medium leading-relaxed uppercase tracking-[0.2em]">
               Our commitment to the future involves a circular economy model and transparent logistics. Every piece is a testament to architectural integrity and ethical production.
            </p>
            <Link to="/products" className="text-[10px] font-black border-b border-black pb-1 uppercase tracking-widest">Learn More</Link>
         </section>
      </div>
   );
}
