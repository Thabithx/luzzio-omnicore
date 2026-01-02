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

         {/* SECTION 3: CATEGORY VISUALS */}
         <section className="grid grid-cols-1 md:grid-cols-2">
            <div className="aspect-[4/5] relative group overflow-hidden border-r border-black border-y">
               <img src={bootsImg} alt="Footwear" className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
               <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
               <div className="absolute bottom-10 inset-x-0 text-center space-y-4">
                  <h4 className="text-white text-2xl font-black uppercase tracking-widest">Premium Denim</h4>
                  <div className="flex justify-center gap-4">
                     <Link to="/products" className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all">Shop</Link>
                  </div>
               </div>
            </div>
            <div className="aspect-[4/5] bg-brand-grey flex flex-col items-center justify-center p-20 space-y-10 text-center border-l border-y border-black">
               <div className="space-y-4">
                  <p className="text-small-brand text-gray-400">The New Standard</p>
                  <h2 className="text-5xl font-black uppercase tracking-tighter">Spring 26 Explore</h2>
               </div>
               <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  An exploration of volume, silhouette, and the deconstruction of the everyday. Designed for the bold and the uncompromising.
               </p>
               <Link to="/products" className="btn-brand">
                  Explore Collection
               </Link>
            </div>
         </section>

         {/* NEW ARRIVALS GRID */}
         <section className="border-t border-black">
            <div className="flex flex-col items-center text-center py-20 border-b border-black bg-brand-grey">
               <h2 className="text-3xl font-black uppercase tracking-widest">Selected Archives</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/30 mt-4">Spring 26 New Arrivals</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-b border-black">
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

         {/* SECTION 4: CATEGORY SHOWCASE - FULL WIDTH IMPACT */}
         <section className="border-t border-black">
            <div className="grid grid-cols-1 md:grid-cols-3">
               {[
                  { name: 'Ready-to-Wear', img: heroImg, link: '/products?category=ready-to-wear' },
                  { name: 'Denim Archive', img: bootsImg, link: '/products?category=denim' },
                  { name: 'Accessories', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop', link: '/products?category=accessories' }
               ].map((cat, i) => (
                  <Link
                     key={i}
                     to={cat.link}
                     className="relative aspect-[4/5] group overflow-hidden border-b md:border-b-0 md:border-r border-black last:border-r-0"
                  >
                     <img
                        src={cat.img}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                     />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-4">
                        <h4 className="text-white text-2xl font-black uppercase tracking-[0.2em]">{cat.name}</h4>
                        <span className="text-white text-[9px] font-black uppercase tracking-[0.4em] border-b border-white pb-1 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">Explore Collection</span>
                     </div>
                  </Link>
               ))}
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
