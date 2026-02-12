import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import Meta from '../components/ui/Meta';
import { ChevronDown, Plus, Minus, X, ArrowRight } from 'lucide-react';
import { ProductCard } from '../components/ui/ProductCard';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { cn } from '../utils/cn';
import { Reviews } from '../components/Reviews';
import * as metaPixel from '../utils/metaPixel';
import { KokoWidget } from '../components/ui/KokoWidget';
import CountdownTimer from '../components/ui/CountdownTimer';


export function ProductDetail() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { addToCart } = useCart();
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedSize, setSelectedSize] = useState('');
   const [selectedColor, setSelectedColor] = useState('');
   const [quantity, setQuantity] = useState(1);
   const [adding, setAdding] = useState(false);
   const [added, setAdded] = useState(false);
   const [showSizeGuide, setShowSizeGuide] = useState(false);
   const [globalSettings, setGlobalSettings] = useState(null);

   const [activeImageIndex, setActiveImageIndex] = useState(0);
   const [scrollProgress, setScrollProgress] = useState(0);
   const scrollContainerRef = useRef(null);
   const [recommendedProducts, setRecommendedProducts] = useState([]);
   const [loadingRecommended, setLoadingRecommended] = useState(true);
   const recommendedRef = useRef(null);
   const [recommendedProgress, setRecommendedProgress] = useState(0);

   const handleScroll = () => {
      if (scrollContainerRef.current) {
         const { scrollLeft, scrollWidth, offsetWidth } = scrollContainerRef.current;
         const index = Math.round(scrollLeft / offsetWidth);
         setActiveImageIndex(index);

         const progress = (scrollLeft / (scrollWidth - offsetWidth)) * 100;
         setScrollProgress(progress);
      }
   };

   const handleRecommendedScroll = () => {
      if (recommendedRef.current) {
         const { scrollLeft, scrollWidth, offsetWidth } = recommendedRef.current;
         const progress = (scrollLeft / (scrollWidth - offsetWidth)) * 100;
         setRecommendedProgress(progress);
      }
   };

   const handleAddToCart = async () => {
      if (!selectedSize || (product.colors?.length > 0 && !selectedColor)) return;
      setAdding(true);
      await addToCart(product, quantity, selectedSize, selectedColor);
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      // Feedback is handled by cart context or UI, but we stay on page
   };

   const handleBuyNow = async () => {
      if (!selectedSize || (product.colors?.length > 0 && !selectedColor)) return;
      setAdding(true);
      await addToCart(product, quantity, selectedSize, selectedColor);
      setAdding(false);
      navigate('/checkout');
   };

   useEffect(() => {
      const fetchProduct = async () => {
         try {
            setLoading(true);
            const res = await api.get(`/products/${id}`);
            const prodData = res.data.data;
            setProduct(prodData);
            // Default Selection Logic: Smart Pre-selection
            if (prodData.colors?.length > 0) {
               setSelectedColor(prodData.colors[0]);
            }

            if (prodData.sizes?.length > 0) {
               // Protocol: Identify smallest available stock variant
               const firstInStock = prodData.sizes.find(size => {
                  const variant = prodData.variants?.find(v => v.size === size);
                  return variant ? variant.stock > 0 : true;
               });
               setSelectedSize(firstInStock || prodData.sizes[0]);
            }

            // Meta Pixel Tracking
            metaPixel.viewContent(prodData);

            // Fetch recommendations
            setLoadingRecommended(true);
            const allRes = await api.get('/products');
            const allProds = allRes.data.data;

            // Filter by category (using either categories array or category field)
            const related = allProds.filter(p => {
               if (p._id === id) return false;

               const sameCategory = p.categories?.some(cat =>
                  prodData.categories?.some(pCat => pCat._id === cat._id)
               ) || p.category?._id === prodData.category?._id;

               return sameCategory;
            }).slice(0, 8);

            setRecommendedProducts(related);
         } catch (err) {
            console.error('Error fetching product:', err);
         } finally {
            setLoading(false);
            setLoadingRecommended(false);
         }
      };
      fetchProduct();

      const fetchSettings = async () => {
         try {
            const res = await api.get('/settings');
            setGlobalSettings(res.data.data);
         } catch (err) {
            console.error('Error fetching global settings:', err);
         }
      };
      fetchSettings();

      // Scroll to top on ID change
      window.scrollTo(0, 0);
   }, [id]);

   // Handle Default Gallery Selection (2nd Image Protocol)
   useEffect(() => {
      if (!loading && product && product.images?.length > 1 && scrollContainerRef.current) {
         // Protocol requires a short delay for DOM stabilization
         const timer = setTimeout(() => {
            const container = scrollContainerRef.current;
            const isMobile = window.innerWidth < 1024;

            if (isMobile) {
               // Horizontal Scroll to the 2nd item
               container.scrollLeft = container.offsetWidth;
            } else {
               // Vertical Scroll - Identify 2nd image position
               const items = container.children;
               if (items[1]) {
                  container.scrollTop = items[1].offsetTop;
               }
            }
            setActiveImageIndex(1);
         }, 100);
         return () => clearTimeout(timer);
      }
   }, [loading, product, id]);

   if (loading) return <div className="min-h-screen flex items-center justify-center text-small-brand animate-pulse">Retrieving Product Details...</div>;
   if (!product) return <div className="min-h-screen flex items-center justify-center text-small-brand">Product not found.</div>;

   const productImages = product.images?.length > 0 ? product.images : [
      "https://placehold.co/1200x1600/F6F6F6/000000?text=LUZZIO+STORY+1",
      "https://placehold.co/1200x1600/F6F6F6/000000?text=LUZZIO+STORY+2"
   ];

   return (
      <div className="min-h-screen bg-white">
         <Meta
            title={`${product.name} | Luzzio`}
            description={product.description || `Buy ${product.name} at Luzzio. Luxury fashion collection.`}
         />

         <div className="flex flex-col lg:flex-row">
            {/* LEFT: VISUAL GALLERY */}
            <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
               {/* Mobile Slider Container */}
               <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory scroll-smooth relative touch-auto antialiased ios-slider-scrollbar"
                  style={{ WebkitOverflowScrolling: 'touch' }}
               >
                  {productImages.map((img, index) => (
                     <div
                        key={index}
                        className="min-w-full lg:min-w-0 w-full snap-center border-b border-black last:border-b-0 flex-shrink-0 relative"
                     >
                        {index === 0 && product.salePrice > 0 && (
                           <div className="absolute top-0 right-0 z-10 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                              Sale
                           </div>
                        )}
                        <img
                           src={img}
                           alt={`${product.name} view ${index + 1}`}
                           className="w-full h-auto transition-all duration-700"
                        />
                     </div>
                  ))}


               </div>

               {/* Premium Custom Scroll Progress Bar */}
               <div className="lg:hidden slider-progress-container border-b border-black">
                  <div
                     className="slider-progress-bar"
                     style={{
                        width: `${100 / (productImages.length || 1)}%`,
                        transform: `translateX(${scrollProgress * (productImages.length - 1)}%)`
                     }}
                  />
               </div>
            </div>

            {/* RIGHT: STICKY PRODUCT INFO */}
            <div className="w-full lg:w-[40%] px-4 md:px-10 lg:px-14 pt-10 md:pt-16 lg:pt-20 pb-20 lg:sticky lg:top-12 lg:h-[calc(100vh-48px)] overflow-y-auto bg-white lg:border-l border-black">
               <div className="max-w-md mx-auto space-y-6">

                  {/* BRANDING & PRICE */}
                  <div className="space-y-2">
                     <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-[1.1] text-black">
                        {product.name}
                     </h1>
                     <div className="pt-1 flex flex-col">
                        {product.salePrice > 0 ? (
                           <>
                              <p className="text-lg font-bold text-black tracking-tighter">LKR {product.salePrice.toLocaleString()}.00</p>
                              <p className="text-xs font-bold text-gray-400 line-through tracking-tight opacity-50">LKR {product.price.toLocaleString()}.00</p>
                           </>
                        ) : (
                           <p className="text-lg font-bold text-black tracking-tighter">LKR {product.price.toLocaleString()}.00</p>
                        )}
                        <KokoWidget
                           price={product.salePrice > 0 ? product.salePrice : product.price}
                           className="mt-2"
                        />
                     </div>

                  </div>

                  {/* COLOR SELECTION */}
                  {product.colors?.length > 0 && (
                     <div className="space-y-4 pt-5 border-t border-black">
                        <div className="flex justify-between items-baseline">
                           <span className="text-[10px] uppercase font-black tracking-[0.15em] text-black" id="scroll-to-color">Color</span>
                           <span className="text-[10px] uppercase font-medium tracking-[0.1em] text-black/40">{selectedColor}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {product.colors.map(color => (
                              <button
                                 key={color}
                                 onClick={() => setSelectedColor(color)}
                                 className={cn(
                                    "px-6 py-3 text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-300",
                                    selectedColor === color
                                       ? "bg-black text-white border-black"
                                       : "bg-white text-black border-gray-200 hover:border-black"
                                 )}
                              >
                                 {color}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* SIZE SELECTION */}
                  <div className="space-y-4 pt-5 border-t border-black">
                     <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-black tracking-[0.15em] text-black">Size (US/EU)</span>
                        {product.sizeChart && (
                           <button
                              onClick={() => setShowSizeGuide(true)}
                              className="text-[9px] uppercase font-bold text-black/30 hover:text-black transition-colors border-b border-transparent hover:border-black"
                           >
                              Size Guide
                           </button>
                        )}
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {product.sizes?.map(size => {
                           const variant = product.variants?.find(v => v.size === size);
                           const isOutOfStock = variant && variant.stock <= 0;

                           return (
                              <button
                                 key={size}
                                 disabled={isOutOfStock}
                                 onClick={() => {
                                    setSelectedSize(size);
                                    setQuantity(1);
                                 }}
                                 className={cn(
                                    "px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-300 relative overflow-hidden",
                                    selectedSize === size
                                       ? "bg-black text-white border-black"
                                       : isOutOfStock
                                          ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                          : "bg-white text-black border-gray-200 hover:border-black"
                                 )}
                              >
                                 <span className={cn(isOutOfStock && "opacity-50")}>{size}</span>
                                 {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="w-full h-[1px] bg-gray-300 -rotate-12"></div>
                                    </div>
                                 )}
                              </button>
                           );
                        })}
                        {(!product.sizes || product.sizes.length === 0) && (
                           <p className="text-[10px] text-gray-400 italic">One Size</p>
                        )}
                     </div>

                     {/* QUANTITY SELECTION */}
                     {selectedSize && (
                        <div className="pt-6 border-t border-black space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black tracking-[0.15em] text-black">Quantity</span>
                              <div className="flex items-center border border-black h-12">
                                 <button
                                    disabled={!selectedSize || (product.variants?.find(v => v.size === selectedSize)?.stock <= 0)}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                 >
                                    <Minus size={12} />
                                 </button>
                                 <div className="w-12 h-full flex items-center justify-center text-[10px] font-black border-x border-black">
                                    {quantity}
                                 </div>
                                 <button
                                    disabled={!selectedSize || (product.variants?.find(v => v.size === selectedSize)?.stock <= quantity)}
                                    onClick={() => {
                                       const variant = product.variants?.find(v => v.size === selectedSize);
                                       const maxStock = variant ? variant.stock : 1;
                                       setQuantity(Math.min(maxStock, quantity + 1));
                                    }}
                                    className="w-12 h-full flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                 >
                                    <Plus size={12} />
                                 </button>
                              </div>

                           </div>
                        </div>
                     )}
                  </div>

                  {/* ADD TO BAG */}
                  <div className="space-y-4 pt-2">
                     <div className="grid grid-cols-2 gap-4">
                        <button
                           disabled={!selectedSize || (product.colors?.length > 0 && !selectedColor) || adding || (product.variants?.find(v => v.size === selectedSize)?.stock <= 0)}
                           onClick={handleAddToCart}
                           className={cn(
                              "w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                              (selectedSize && (product.colors?.length > 0 ? selectedColor : true) && (product.variants?.find(v => v.size === selectedSize)?.stock > 0))
                                 ? "bg-white text-black hover:bg-black hover:text-white border border-black"
                                 : "bg-gray-50 text-stone-300 cursor-not-allowed border border-gray-100"
                           )}
                        >
                           {adding ? "..." : (product.variants?.find(v => v.size === selectedSize)?.stock <= 0) ? "OUT OF STOCK" : added ? "ADDED" : "Add to Bag"}
                        </button>
                        <button
                           disabled={!selectedSize || (product.colors?.length > 0 && !selectedColor) || adding || (product.variants?.find(v => v.size === selectedSize)?.stock <= 0)}
                           onClick={handleBuyNow}
                           className={cn(
                              "w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                              (selectedSize && (product.colors?.length > 0 ? selectedColor : true) && (product.variants?.find(v => v.size === selectedSize)?.stock > 0))
                                 ? "bg-black text-white hover:bg-stone-900 border border-black shadow-xl"
                                 : "bg-gray-50 text-stone-300 cursor-not-allowed border border-gray-100"
                           )}
                        >
                           Buy It Now
                        </button>

                     </div>

                     {/* GLOBAL TIMER */}
                     {globalSettings?.timerEnabled && (
                        <CountdownTimer
                           endTime={globalSettings.timerEndTime}
                           message={globalSettings.timerMessage}
                        />
                     )}
                  </div>

                  {/* PRODUCT DETAILS ACCORDION */}
                  <div className="pt-8 space-y-0 text-left">
                     <details className="group border-t border-black py-4 text-left" open>
                        <summary className="flex justify-between items-center list-none cursor-pointer">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-black">Product Details</span>
                           <Plus size={12} className="group-open:hidden text-black/40" />
                           <Minus size={12} className="hidden group-open:block text-black/40" />
                        </summary>
                        <div className="mt-4 text-[10px] leading-[2] font-medium text-black/60 uppercase tracking-[0.15em] space-y-6 max-w-sm">
                           {product.sizeChart && (
                              <div className="mb-6 border border-black p-2">
                                 <img src={product.sizeChart} alt="Size Guide" className="w-full h-auto" />
                              </div>
                           )}
                           <div className="normal-case font-normal text-xs text-black/80 whitespace-pre-wrap leading-relaxed italic px-2 border-l-2 border-black/5">
                              {product.description}
                           </div>
                           <ul className="space-y-4 pl-1">


                              {product.material && <li className="flex items-start gap-3"><span className="text-black/20">•</span> <span>{product.material}</span></li>}
                           </ul>
                        </div>
                     </details>



                  </div>
               </div>
            </div>
         </div>

         {/* REVIEWS SECTION */}
         <div className="px-6 md:px-12 lg:px-20 py-20 border-t border-black" >
            <Reviews
               productId={product._id}
               reviews={product.reviews || []}
               onReviewAdded={(newReview) => {
                  setProduct(prev => ({
                     ...prev,
                     reviews: [...prev.reviews, newReview],
                     numReviews: prev.numReviews + 1,
                     rating: ((prev.rating * prev.numReviews) + newReview.rating) / (prev.numReviews + 1)
                  }));
               }}
               onReviewDeleted={(deletedReviewId) => {
                  setProduct(prev => {
                     const updatedReviews = prev.reviews.filter(r => r._id !== deletedReviewId);
                     const numReviews = updatedReviews.length;
                     const rating = numReviews > 0
                        ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
                        : 0;
                     return { ...prev, reviews: updatedReviews, numReviews, rating };
                  });
               }}
            />
         </div >

         {/* SIZE GUIDE MODAL */}
         {
            showSizeGuide && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)}>
                  <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={e => e.stopPropagation()}>
                     <button
                        onClick={() => setShowSizeGuide(false)}
                        className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-stone-800 transition-colors z-10"
                     >
                        <X size={20} />
                     </button>
                     <img
                        src={product.sizeChart}
                        alt="Size Guide"
                        className="w-full h-auto"
                     />
                  </div>
               </div>
            )
         }
         {/* RECOMMENDED PRODUCTS SLIDER */}
         {
            recommendedProducts.length > 0 && (
               <section className="bg-brand-grey border-t border-black">
                  <div className="flex flex-col items-center py-16 border-b border-black">
                     <h2 className="text-lg md:text-3xl font-black uppercase tracking-[0.4em]">Recommended for You</h2>
                     <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.6em] text-black/30 mt-4 italic">You Might Also Like</p>
                  </div>

                  <div
                     ref={recommendedRef}
                     onScroll={handleRecommendedScroll}
                     className="overflow-x-auto ios-slider-scrollbar bg-white"
                  >
                     <div className="flex">
                        {recommendedProducts.map((p) => (
                           <div key={p._id} className="min-w-[50%] md:min-w-[25%] border-r border-b border-black md:last:border-r-0">
                              <ProductCard product={p} />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="slider-progress-container border-b border-black">
                     <div
                        className="slider-progress-bar"
                        style={{
                           width: `25%`,
                           transform: `translateX(${recommendedProgress * 3}%)`
                        }}
                     />
                  </div>

                  <div className="py-12 flex justify-center bg-brand-grey">
                     <Link
                        to="/products"
                        className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-1 hover:opacity-50 transition-opacity text-black"
                     >
                        Explore Collection
                     </Link>
                  </div>
               </section>
            )
         }
      </div >
   );
}
