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
import heroImg from '../assets/hero_new.jpg';
import heroMobile from '../assets/hero_mobile.png';
import heroOld from '../assets/hero.jpg';
import bootsImg from '../assets/boots.png';
import hoodieCat from '../assets/hoodie.jpg';
import bootCat from '../assets/boot.jpg';
import bagsImg from '../assets/bags.jpg';

export function Home() {
   const [newProducts, setNewProducts] = useState([]);
   const [bestSellers, setBestSellers] = useState([]);
   const [saleProducts, setSaleProducts] = useState([]);
   const [premiumPolos, setPremiumPolos] = useState([]);
   const [premiumChinos, setPremiumChinos] = useState([]);
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

            // Helpers for custom sections
            const matchesCategory = (p, name) => {
               const search = name.toLowerCase();
               return (
                  p.categories?.some(cat => cat.name?.toLowerCase() === search) ||
                  p.category?.name?.toLowerCase() === search
               );
            };

            setNewProducts(products.filter(p => matchesCategory(p, 'new') || matchesCategory(p, 'new arrivals')).slice(0, 8));
            setBestSellers(products.filter(p => matchesCategory(p, 'best sellers') || matchesCategory(p, 'bestsellers')).slice(0, 8));
            setSaleProducts(products.filter(p => matchesCategory(p, 'sale')).slice(0, 8));
            setPremiumPolos(products.filter(p => matchesCategory(p, 'premium polos')).slice(0, 8));
            setPremiumChinos(products.filter(p => matchesCategory(p, 'premium chinos')).slice(0, 8));
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
         <section className="relative h-[85vh] md:h-screen overflow-hidden group">
            <picture>
               <source srcSet={heroMobile} media="(max-width: 768px)" />
               <img
                  src={heroImg}
                  alt="Hero"
                  className="absolute inset-0 w-full h-full object-cover object-center grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
               />
            </picture>



            <div className="absolute inset-x-0 bottom-20 flex flex-col items-center space-y-8 z-10 px-10 text-center">
               <div className="space-y-2">
                  <h2 className="text-white text-base md:text-xl font-black uppercase tracking-[0.6em]">Built to Last</h2>
                  <p className="text-white/70 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em]">Premium collections</p>
               </div>
               <div className="flex gap-4">
                  <Link to="/products">
                     <button className="px-10 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white border border-black transition-all duration-500 rounded-sm">
                        Shop
                     </button>
                  </Link>
               </div>
            </div>
         </section>


         {/* SECTION 2: NEW ARRIVALS */}
         {(loading || newProducts.length > 0) && (
            <section className="bg-brand-grey border-b border-black">
               <div className="flex flex-col items-start text-left px-4 md:px-10 md:items-center md:text-center py-8 md:py-16 bg-brand-grey border-b border-black">
                  <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">New Arrivals</h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-2 md:mt-4 italic">Explore Latest Release</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
                  {loading ? (
                     Array(8).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                     ))
                  ) : (
                     newProducts.map((product, idx) => {
                        const isLastRowMobile = idx >= (Math.ceil(newProducts.length / 2) - 1) * 2;
                        const isLastRowDesktop = idx >= (Math.ceil(newProducts.length / 4) - 1) * 4;

                        return (
                           <div key={product._id} className={cn(
                              "border-black",
                              !isLastRowMobile ? "border-b" : "border-b-0",
                              !isLastRowDesktop ? "md:border-b" : "md:border-b-0",
                              idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                              idx % 4 === 3 ? "md:border-r-0" : ""
                           )}>
                              <ProductCard product={product} />
                           </div>
                        );
                     })
                  )}
               </div>
               <div className="py-10 flex justify-center bg-brand-grey">
                  <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                     View All Products
                  </Link>
               </div>
            </section>
         )}



         {/* CATEGORY DROPDOWNS - ACCORDION STYLE */}
         <section className="bg-brand-grey-dark border-t border-black">
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
                        className="w-full flex justify-between items-center px-4 md:px-10 py-6 md:py-8 bg-brand-grey-dark hover:bg-black hover:text-white transition-colors group"
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
                        <div className="bg-brand-grey-dark px-0">
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

         {/* BEST SELLERS SECTION */}
         {(loading || bestSellers.length > 0) && (
            <section className="bg-brand-grey border-b border-black">
               <div className="flex flex-col items-start text-left px-4 md:px-10 md:items-center md:text-center py-8 md:py-16 bg-brand-grey border-b border-black">
                  <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">Best Sellers</h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-2 md:mt-4 italic">Most Exquisite Pieces</p>
               </div>

               {/* Products Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
                  {loading ? (
                     Array(8).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                     ))
                  ) : bestSellers.map((product, idx) => {
                     const isLastRowMobile = idx >= (Math.ceil(bestSellers.length / 2) - 1) * 2;
                     const isLastRowDesktop = idx >= (Math.ceil(bestSellers.length / 4) - 1) * 4;

                     return (
                        <div key={product._id} className={cn(
                           "border-black",
                           !isLastRowMobile ? "border-b" : "border-b-0",
                           !isLastRowDesktop ? "md:border-b" : "md:border-b-0",
                           idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                           idx % 4 === 3 ? "md:border-r-0" : ""
                        )}>
                           <ProductCard product={product} />
                        </div>
                     );
                  })}
               </div>

               <div className="py-10 flex justify-center bg-brand-grey">
                  <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                     Explore Collection
                  </Link>
               </div>
            </section>
         )}

         {/* PREMIUM POLOS SECTION */}
         {(loading || premiumPolos.length > 0) && (
            <section className="bg-brand-grey border-b border-black">
               <div className="flex flex-col items-start text-left px-4 md:px-10 md:items-center md:text-center py-8 md:py-16 bg-brand-grey border-b border-black">
                  <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">Premium Polos</h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-2 md:mt-4 italic">Architectural Precision</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
                  {loading ? (
                     Array(8).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                     ))
                  ) : (
                     premiumPolos.map((product, idx) => {
                        const isLastRowMobile = idx >= (Math.ceil(premiumPolos.length / 2) - 1) * 2;
                        const isLastRowDesktop = idx >= (Math.ceil(premiumPolos.length / 4) - 1) * 4;

                        return (
                           <div key={product._id} className={cn(
                              "border-black",
                              !isLastRowMobile ? "border-b" : "border-b-0",
                              !isLastRowDesktop ? "md:border-b" : "md:border-b-0",
                              idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                              idx % 4 === 3 ? "md:border-r-0" : ""
                           )}>
                              <ProductCard product={product} />
                           </div>
                        );
                     })
                  )}
               </div>
               <div className="py-10 flex justify-center bg-brand-grey">
                  <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                     Shop Polos
                  </Link>
               </div>
            </section>
         )}

         {/* PREMIUM CHINOS SECTION */}
         {(loading || premiumChinos.length > 0) && (
            <section className="bg-brand-grey border-b border-black">
               <div className="flex flex-col items-start text-left px-4 md:px-10 md:items-center md:text-center py-8 md:py-16 bg-brand-grey border-b border-black">
                  <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">Premium Chinos</h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-2 md:mt-4 italic">Refined Silhouette</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
                  {loading ? (
                     Array(8).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                     ))
                  ) : (
                     premiumChinos.map((product, idx) => {
                        const isLastRowMobile = idx >= (Math.ceil(premiumChinos.length / 2) - 1) * 2;
                        const isLastRowDesktop = idx >= (Math.ceil(premiumChinos.length / 4) - 1) * 4;

                        return (
                           <div key={product._id} className={cn(
                              "border-black",
                              !isLastRowMobile ? "border-b" : "border-b-0",
                              !isLastRowDesktop ? "md:border-b" : "md:border-b-0",
                              idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                              idx % 4 === 3 ? "md:border-r-0" : ""
                           )}>
                              <ProductCard product={product} />
                           </div>
                        );
                     })
                  )}
               </div>
               <div className="py-10 flex justify-center bg-brand-grey">
                  <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                     Shop Chinos
                  </Link>
               </div>
            </section>
         )}

         {/* SALE SECTION */}
         {(loading || saleProducts.length > 0) && (
            <section className="bg-brand-grey border-t border-b border-black">
               <div className="flex flex-col items-start text-left px-4 md:px-10 md:items-center md:text-center py-8 md:py-16 bg-brand-grey border-b border-black">
                  <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">Sale</h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-2 md:mt-4 italic">Limited Time Offers</p>
               </div>

               {/* Products Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-black">
                  {loading ? (
                     Array(8).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-brand-grey animate-pulse border-r border-black last:border-r-0" />
                     ))
                  ) : saleProducts.map((product, idx) => {
                     const isLastRowMobile = idx >= (Math.ceil(saleProducts.length / 2) - 1) * 2;
                     const isLastRowDesktop = idx >= (Math.ceil(saleProducts.length / 4) - 1) * 4;

                     return (
                        <div key={product._id} className={cn(
                           "border-black",
                           !isLastRowMobile ? "border-b" : "border-b-0",
                           !isLastRowDesktop ? "md:border-b" : "md:border-b-0",
                           idx % 2 === 0 ? "border-r" : "border-r-0 md:border-r",
                           idx % 4 === 3 ? "md:border-r-0" : ""
                        )}>
                           <ProductCard product={product} />
                        </div>
                     );
                  })}
               </div>

               <div className="py-10 flex justify-center bg-brand-grey">
                  <Link to="/products" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black/60">
                     Shop All Sale
                  </Link>
               </div>
            </section>
         )}

         {/* INTERSTITIAL SECTION */}
         <section className="py-20 md:py-24 bg-brand-grey flex flex-col items-center justify-center space-y-8 text-center px-4 md:px-10 border-t border-black">
            <div className="space-y-3">
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
