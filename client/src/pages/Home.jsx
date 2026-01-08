import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { Link } from 'react-router-dom';
import Meta from '../components/ui/Meta';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

// Import brand assets
import heroVideo from '../assets/hero.mp4';
import heroImg from '../assets/hero.jpg';
import bootsImg from '../assets/boots.png';
import hoodieCat from '../assets/hoodie.jpg';
import bootCat from '../assets/boot.jpg';
import bagsImg from '../assets/bags.jpg';

export function Home() {
   const [newProducts, setNewProducts] = useState([]);
   const [bestSellers, setBestSellers] = useState([]);
   const [saleProducts, setSaleProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [allProducts, setAllProducts] = useState([]);
   const [activeCategory, setActiveCategory] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchProducts = async () => {
         try {
            const [productsRes, categoriesRes] = await Promise.all([
               api.get('/products?limit=1000'),
               api.get('/categories')
            ]);

            const products = productsRes.data.data;
            setAllProducts(products);
            setCategories(categoriesRes.data.data);

            // Helper to check if product matches "New" category
            const isNew = (p) => {
               // Check new categories array
               if (p.categories?.some(cat => cat.name?.toLowerCase() === 'new')) return true;
               // Check legacy category field
               if (p.category?.name?.toLowerCase() === 'new') return true;
               return false;
            };

            // Helper to check if product matches "Best Sellers"
            const isBestSeller = (p) => {
               // Check new categories array
               if (p.categories?.some(cat =>
                  cat.name?.toLowerCase() === 'best sellers' ||
                  cat.name?.toLowerCase() === 'bestsellers'
               )) return true;
               // Check legacy category field
               if (p.category?.name?.toLowerCase() === 'best sellers' ||
                  p.category?.name?.toLowerCase() === 'bestsellers') return true;
               return false;
            };

            // Helper to check if product matches "Sale"
            const isSale = (p) => {
               // Check new categories array
               if (p.categories?.some(cat => cat.name?.toLowerCase() === 'sale')) return true;
               // Check legacy category field
               if (p.category?.name?.toLowerCase() === 'sale') return true;
               return false;
            };

            setNewProducts(products.filter(isNew).slice(0, 4));
            setBestSellers(products.filter(isBestSeller));
            setSaleProducts(products.filter(isSale));
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
            <video
               autoPlay
               loop
               muted
               playsInline
               poster={heroImg}
               className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
               key="hero-video"
            >
               <source src={heroVideo} type="video/mp4" />
               Your browser does not support the video tag.
            </video>
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
                  newProducts.map((product, idx) => (
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

         {/* BEST SELLERS SLIDER */}
         <section className="bg-white border-b border-black">
            <div className="flex flex-col items-center text-center py-12 md:py-24 bg-brand-grey border-b border-black">
               <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.4em]">Best Sellers</h2>
               <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-4 md:mt-6 italic">Most Coveted Pieces</p>
            </div>

            {/* Horizontal Scrolling Product Slider */}
            <div className="overflow-x-auto no-scrollbar">
               <div className="flex border-b border-black">
                  {loading ? (
                     Array(4).fill(0).map((_, i) => (
                        <div key={i} className="min-w-[50%] md:min-w-[25%] aspect-[3/4] bg-brand-grey animate-pulse border-r border-black" />
                     ))
                  ) : bestSellers.length > 0 ? (
                     bestSellers.map((product) => (
                        <div key={product._id} className="min-w-[50%] md:min-w-[25%] border-r border-black last:border-r-0">
                           <ProductCard product={product} />
                        </div>
                     ))
                  ) : (
                     <div className="w-full py-20 text-center">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                           No Best Sellers Available
                        </p>
                     </div>
                  )}
               </div>
            </div>

            <div className="py-10 flex justify-center bg-brand-grey">
               <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                  Explore Collection
               </Link>
            </div>
         </section>



         {/* CATEGORY DROPDOWNS - ACCORDION STYLE */}
         <section className="bg-white border-t border-black">
            {categories.map((category, index) => {
               const isOpen = activeCategory === category._id;

               // Filter products for this category
               const categoryProducts = allProducts.filter(p => {
                  // Check new categories array
                  if (p.categories?.some(cat =>
                     cat._id === category._id || cat === category._id
                  )) return true;

                  // Check legacy category field
                  if (p.category?._id === category._id || p.category === category._id) return true;

                  return false;
               });

               return (
                  <div key={category._id} className="border-b border-black last:border-b-0">
                     {/* Category Header - Clickable */}
                     <button
                        onClick={() => setActiveCategory(isOpen ? null : category._id)}
                        className="w-full flex justify-between items-center px-5 md:px-10 py-6 md:py-8 bg-brand-grey hover:bg-black hover:text-white transition-colors group"
                     >
                        <h3 className="text-[10px] md:text-base font-black uppercase tracking-[0.3em] text-left">
                           {category.name}
                        </h3>
                        <ChevronDown
                           size={16}
                           className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                        />
                     </button>

                     {/* Category Products Grid - Expandable */}
                     <div
                        className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[5000px]' : 'max-h-0'
                           }`}
                     >
                        <div className="bg-white">
                           {categoryProducts.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                                 {categoryProducts.map((product, idx) => (
                                    <div
                                       key={product._id}
                                       className={cn(
                                          "border-black",
                                          idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                                          idx % 4 === 3 ? "md:border-r-0" : "",
                                          idx < categoryProducts.length - 2 ? "border-b" : "border-b md:border-b-0"
                                       )}
                                    >
                                       <ProductCard product={product} />
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-20 text-center">
                                 <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                                    No Products in this Category
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}

            {/* Empty State if no categories */}
            {categories.length === 0 && !loading && (
               <div className="py-20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                     No Categories Available
                  </p>
               </div>
            )}
         </section>

         {/* SALE SLIDER */}
         <section className="bg-white border-t border-b border-black">
            <div className="flex flex-col items-center text-center py-12 md:py-24 bg-brand-grey border-b border-black">
               <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.4em]">Sale</h2>
               <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-4 md:mt-6 italic">Limited Time Offers</p>
            </div>

            {/* Horizontal Scrolling Product Slider */}
            <div className="overflow-x-auto no-scrollbar">
               <div className="flex border-b border-black">
                  {loading ? (
                     Array(4).fill(0).map((_, i) => (
                        <div key={i} className="min-w-[50%] md:min-w-[25%] aspect-[3/4] bg-brand-grey animate-pulse border-r border-black" />
                     ))
                  ) : saleProducts.length > 0 ? (
                     saleProducts.map((product) => (
                        <div key={product._id} className="min-w-[50%] md:min-w-[25%] border-r border-black last:border-r-0">
                           <ProductCard product={product} />
                        </div>
                     ))
                  ) : (
                     <div className="w-full py-20 text-center">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                           No Sale Products Available
                        </p>
                     </div>
                  )}
               </div>
            </div>

            <div className="py-10 flex justify-center bg-brand-grey">
               <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                  Shop All Sale
               </Link>
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
