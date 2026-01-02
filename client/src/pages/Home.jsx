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

         {/* SECTION 3: CATEGORY VISUALS - BALENCIAGA REDESIGN */}
         <section className="flex flex-col">
            {/* CATEGORY 1: READY-TO-WEAR */}
            <div className="relative h-[80vh] md:h-screen w-full flex items-center justify-center bg-white border-b border-black group overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center p-10 md:p-20">
                  <img
                     src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop"
                     alt="Ready to Wear"
                     className="max-h-full w-auto object-contain transition-transform duration-1000 group-hover:scale-105"
                  />
               </div>
               <div className="absolute inset-x-0 bottom-20 flex flex-col items-center space-y-6">
                  <h4 className="text-xl md:text-3xl font-black uppercase tracking-[0.4em] text-black">Ready-to-Wear</h4>
                  <Link to="/products?category=ready-to-wear">
                     <button className="px-12 py-3 border border-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500 bg-white/80 backdrop-blur-sm md:bg-transparent">
                        Shop Men
                     </button>
                  </Link>
               </div>
            </div>

            {/* CATEGORY 2: DENIM / ARCHIVE */}
            <div className="relative h-[80vh] md:h-screen w-full flex items-center justify-center bg-brand-grey border-b border-black group overflow-hidden">
               <div className="absolute inset-0">
                  <img
                     src="https://images.unsplash.com/photo-1542272230-7f39364515c1?q=80&w=1920&auto=format&fit=crop"
                     alt="Archive Denim"
                     className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-700" />
               </div>
               <div className="absolute inset-x-0 bottom-20 flex flex-col items-center space-y-6 z-10">
                  <h4 className="text-xl md:text-2xl font-black uppercase tracking-[0.4em] text-white">Denim Archive</h4>
                  <Link to="/products?category=denim">
                     <button className="px-12 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500">
                        Shop Archive
                     </button>
                  </Link>
               </div>
            </div>

            {/* CATEGORY 3: ACCESSORIES */}
            <div className="relative h-[80vh] md:h-screen w-full flex items-center justify-center bg-white border-b border-black group overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center p-10 md:p-20">
                  <img
                     src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1920&auto=format&fit=crop"
                     alt="Accessories"
                     className="max-h-[60%] w-auto object-contain transition-transform duration-1000 group-hover:scale-110"
                  />
               </div>
               <div className="absolute inset-x-0 bottom-20 flex flex-col items-center space-y-6">
                  <h4 className="text-xl md:text-3xl font-black uppercase tracking-[0.4em] text-black">Accessories</h4>
                  <Link to="/products?category=accessories">
                     <button className="px-12 py-3 border border-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500 bg-white/80 backdrop-blur-sm md:bg-transparent">
                        Shop Recent
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
