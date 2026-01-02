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

         {/* SECTION 3: BALENCIAGA-STYLE CATEGORY BLOCKS */}
         <section className="bg-white">
            {/* BLOCK 1: LE CITY BAGS / FULL IMAGE */}
            <div className="relative h-[80vh] md:h-screen group overflow-hidden border-b border-black">
               <img
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop"
                  alt="Accessories"
                  className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-[2000ms] group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/20" />
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-6">
                  <h4 className="text-white text-2xl md:text-3xl font-black uppercase tracking-[0.3em] drop-shadow-sm">
                     The Essentials
                  </h4>
                  <Link to="/products?category=accessories">
                     <button className="px-10 py-3 bg-white text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white border border-transparent transition-all duration-500">
                        Shop Now
                     </button>
                  </Link>
               </div>
            </div>

            {/* BLOCK 2: READY-TO-WEAR / WHITE BACKGROUND PRODUCT FOCUS */}
            <div className="flex flex-col items-center justify-center bg-[#F2F2F2] py-20 px-6 border-b border-black">
               <div className="w-full max-w-4xl aspect-square md:aspect-video relative mb-12">
                  <img
                     src={bootsImg}
                     alt="Ready to Wear"
                     className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
                  />
               </div>
               <div className="text-center space-y-6">
                  <h4 className="text-black text-2xl md:text-3xl font-black uppercase tracking-[0.3em]">
                     Ready-to-Wear
                  </h4>
                  <Link to="/products?category=ready-to-wear">
                     <button className="px-12 py-3 border border-black text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500">
                        Shop Collection
                     </button>
                  </Link>
               </div>
            </div>

            {/* BLOCK 3: DENIM ARCHIVE / SPLIT VIEW ON DESKTOP */}
            <div className="grid grid-cols-1 md:grid-cols-2">
               <div className="aspect-[4/5] relative group overflow-hidden border-b md:border-b-0 md:border-r border-black">
                  <img
                     src={heroImg}
                     alt="Denim"
                     className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-[2000ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20" />
                  <div className="absolute bottom-12 inset-x-0 text-center space-y-4">
                     <h4 className="text-white text-xl md:text-2xl font-black uppercase tracking-[0.3em]">Archive Denim</h4>
                     <Link to="/products?category=denim" className="inline-block px-10 py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all">
                        Discover
                     </Link>
                  </div>
               </div>
               <div className="aspect-[4/5] bg-white flex flex-col items-center justify-center p-12 md:p-20 text-center space-y-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Section 04</p>
                     <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">Spring 26 <br /> Perspectives</h2>
                  </div>
                  <p className="text-[11px] md:text-xs text-black/60 font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                     A curated study of silhouette, shadow, and the modern form. Redefining the boundaries of high-fashion minimalism.
                  </p>
                  <Link to="/products" className="px-10 py-4 bg-black text-white text-[9px] font-black uppercase tracking-[0.4em] border border-black hover:bg-transparent hover:text-black transition-all">
                     Shop Archive
                  </Link>
               </div>
            </div>
         </section>

         {/* SELECTED ARCHIVES GRID (FEATURED PRODUCTS) */}
         <section className="border-t border-black bg-white">
            <div className="flex flex-col items-center text-center py-20 border-b border-black">
               <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.3em]">Selected Archives</h2>
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black/20 mt-4">Curated Selection / Spring 26</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-black">
               {loading ? (
                  Array(4).fill(0).map((_, i) => (
                     <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                  ))
               ) : (
                  products.map((product, idx) => (
                     <div key={product._id} className={cn(
                        "border-black border-b lg:border-b-0",
                        idx % 2 === 0 ? "border-r" : "border-r-0 lg:border-r",
                        idx % 4 === 3 ? "lg:border-r-0" : ""
                     )}>
                        <ProductCard product={product} />
                     </div>
                  ))
               )}
            </div>
         </section>

         {/* INTERSTITIAL SECTION */}
         <section className="py-24 md:py-40 bg-white flex flex-col items-center justify-center space-y-12 text-center px-10 border-t border-black">
            <div className="space-y-4">
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Corporate Protocol</p>
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Sustainability</h2>
            </div>
            <p className="max-w-xl text-[10px] md:text-xs text-black/50 font-black uppercase tracking-[0.3em] leading-relaxed">
               Luzzio is committed to architectural integrity and ethical production cycles. Our archive represents more than fashion; it represents a commitment to enduring form.
            </p>
            <Link to="/products" className="text-[9px] font-black border-b border-black pb-1 uppercase tracking-[0.4em]">Read Philosophy</Link>
         </section>
      </div>
   );
}
