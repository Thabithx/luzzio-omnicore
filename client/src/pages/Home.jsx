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

         {/* BALENCIAGA-STYLE CATEGORY STACK */}
         <section className="bg-white">
            {[
               {
                  name: 'Le City Bags',
                  img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop',
                  link: '/products?category=accessories',
                  btn: 'Shop Now'
               },
               {
                  name: 'Ready-to-Wear',
                  img: heroImg,
                  link: '/products?category=ready-to-wear',
                  btn: 'Shop Men'
               },
               {
                  name: 'Denim Archive',
                  img: bootsImg,
                  link: '/products?category=denim',
                  btn: 'Shop Archive'
               },
            ].map((cat, i) => (
               <div key={i} className="relative w-full min-h-[70vh] md:min-h-screen flex flex-col items-center justify-center border-b border-black group overflow-hidden bg-brand-grey">
                  {/* Background Image Container */}
                  <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center p-10 md:p-20">
                     <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-contain md:object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
                     />
                  </div>

                  {/* High-Contrast Overlay for focus */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Centered Content */}
                  <div className="relative z-10 flex flex-col items-center space-y-8 bg-white/40 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none p-10 md:p-0 w-full md:w-auto">
                     <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.4em] text-black text-center">
                        {cat.name}
                     </h2>
                     <Link to={cat.link}>
                        <button className="px-12 py-3 bg-white text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] border border-black hover:bg-black hover:text-white transition-all duration-500 min-w-[200px]">
                           {cat.btn}
                        </button>
                     </Link>
                  </div>
               </div>
            ))}
         </section>

         {/* SELECTED ARRIVALS GRID (Balenciaga style usually has a minimalist product grid too) */}
         <section className="bg-white">
            <div className="flex flex-col items-center text-center py-24 md:py-32 border-b border-black">
               <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.5em]">Featured Archive</h2>
               <div className="w-12 h-px bg-black mt-6" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-black">
               {loading ? (
                  Array(4).fill(0).map((_, i) => (
                     <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                  ))
               ) : (
                  products.map((product, idx) => (
                     <div key={product._id} className={cn(
                        "border-black border-b lg:border-b-0 transition-all duration-700 hover:bg-brand-grey/30",
                        idx % 2 === 0 ? "border-r" : "border-r-0 lg:border-r",
                        idx % 4 === 3 ? "lg:border-r-0" : ""
                     )}>
                        <ProductCard product={product} />
                     </div>
                  ))
               )}
            </div>
         </section>

         {/* INTERSTITIAL - SUSTAINABILITY */}
         <section className="py-32 md:py-48 bg-brand-grey flex flex-col items-center justify-center space-y-12 text-center px-6 md:px-10 border-b border-black relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
               <h2 className="text-[30vw] font-black uppercase tracking-tighter">SUSTAIN</h2>
            </div>
            <div className="relative space-y-10 max-w-2xl">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Governance</p>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">Ethics & <br /> Integrity</h2>
               </div>
               <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed uppercase tracking-[0.2em] max-w-lg mx-auto">
                  Our commitment to the future involves a circular economy model and transparent logistics. Every piece is a testament to architectural integrity.
               </p>
               <Link to="/products" className="inline-block text-[11px] font-black border-b border-black pb-1 uppercase tracking-[0.3em] hover:opacity-50 transition-opacity">
                  Learn More
               </Link>
            </div>
         </section>
      </div>
   );
}
