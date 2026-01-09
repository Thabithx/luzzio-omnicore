import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import Meta from '../components/ui/Meta';
import { ChevronDown, Plus, Minus, X } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { cn } from '../utils/cn';
import { Reviews } from '../components/Reviews';

export function ProductDetail() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { addToCart } = useCart();
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedSize, setSelectedSize] = useState('');
   const [selectedColor, setSelectedColor] = useState('');
   const [adding, setAdding] = useState(false);
   const [added, setAdded] = useState(false);
   const [showSizeGuide, setShowSizeGuide] = useState(false);

   const [activeImageIndex, setActiveImageIndex] = useState(0);
   const scrollContainerRef = useRef(null);

   const handleScroll = () => {
      if (scrollContainerRef.current) {
         const { scrollLeft, offsetWidth } = scrollContainerRef.current;
         const index = Math.round(scrollLeft / offsetWidth);
         setActiveImageIndex(index);
      }
   };

   const handleAddToCart = async () => {
      if (!selectedSize || (product.colors?.length > 0 && !selectedColor)) return;
      setAdding(true);
      await addToCart(product, 1, selectedSize, selectedColor);
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      // Feedback is handled by cart context or UI, but we stay on page
   };

   const handleBuyNow = async () => {
      if (!selectedSize || (product.colors?.length > 0 && !selectedColor)) return;
      setAdding(true);
      await addToCart(product, 1, selectedSize, selectedColor);
      setAdding(false);
      navigate('/checkout');
   };

   useEffect(() => {
      const fetchProduct = async () => {
         try {
            const res = await api.get(`/products/${id}`);
            const prodData = res.data.data;
            setProduct(prodData);
            if (prodData.colors?.length > 0) {
               setSelectedColor(prodData.colors[0]);
            }
         } catch (err) {
            console.error('Error fetching product:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchProduct();
   }, [id]);

   if (loading) return <div className="min-h-screen flex items-center justify-center text-small-brand animate-pulse">Retrieving Product Details...</div>;
   if (!product) return <div className="min-h-screen flex items-center justify-center text-small-brand">Product not found in archive.</div>;

   const productImages = product.images?.length > 0 ? product.images : [
      "https://placehold.co/1200x1600/F6F6F6/000000?text=LUZZIO+STORY+1",
      "https://placehold.co/1200x1600/F6F6F6/000000?text=LUZZIO+STORY+2"
   ];

   return (
      <div className="min-h-screen bg-white">
         <Meta
            title={`${product.name} | Luzzio`}
            description={product.description || `Buy ${product.name} at Luzzio. Luxury fashion archive.`}
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
                        className="min-w-full lg:min-w-0 w-full snap-center border-b border-black last:border-b-0 flex-shrink-0"
                     >
                        <img
                           src={img}
                           alt={`${product.name} view ${index + 1}`}
                           className="w-full h-auto transition-all duration-700"
                        />
                     </div>
                  ))}

                  {/* Mobile Slider Indicators (Dots) */}
                  <div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                     {productImages.map((_, index) => (
                        <div
                           key={index}
                           className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300 drop-shadow-md",
                              activeImageIndex === index ? "bg-black scale-110" : "bg-black/20"
                           )}
                        />
                     ))}
                  </div>
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
                        {product.sizes?.map(size => (
                           <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={cn(
                                 "px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-300",
                                 selectedSize === size
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-black border-gray-200 hover:border-black"
                              )}
                           >
                              {size}
                           </button>
                        ))}
                        {(!product.sizes || product.sizes.length === 0) && (
                           <p className="text-[10px] text-gray-400 italic">One Size</p>
                        )}
                     </div>
                  </div>

                  {/* ADD TO BAG */}
                  <div className="space-y-4 pt-2">
                     <div className="grid grid-cols-2 gap-4">
                        <button
                           disabled={!selectedSize || (product.colors?.length > 0 && !selectedColor) || adding}
                           onClick={handleAddToCart}
                           className={cn(
                              "w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                              (selectedSize && (product.colors?.length > 0 ? selectedColor : true))
                                 ? "bg-white text-black hover:bg-black hover:text-white border border-black"
                                 : "bg-gray-50 text-stone-300 cursor-not-allowed border border-gray-100"
                           )}
                        >
                           {adding ? "..." : added ? "ADDED" : "Add to Bag"}
                        </button>
                        <button
                           disabled={!selectedSize || (product.colors?.length > 0 && !selectedColor) || adding}
                           onClick={handleBuyNow}
                           className={cn(
                              "w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                              (selectedSize && (product.colors?.length > 0 ? selectedColor : true))
                                 ? "bg-black text-white hover:bg-stone-900 border border-black shadow-xl"
                                 : "bg-gray-50 text-stone-300 cursor-not-allowed border border-gray-100"
                           )}
                        >
                           Buy It Now
                        </button>
                     </div>
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
                           <p className="normal-case font-normal text-xs text-black/80 italic px-2 border-l-2 border-black/5">
                              {product.description}
                           </p>
                           <ul className="space-y-4 pl-1">
                              {product.material && <li className="flex items-start gap-3"><span className="text-black/20">•</span> <span>{product.material}</span></li>}
                              <li className="flex items-start gap-3"><span className="text-black/20">•</span> <span>Oversized silhouette</span></li>
                              <li className="flex items-start gap-3"><span className="text-black/20">•</span> <span>Organic heavy fleece carbon-neutral</span></li>
                              <li className="flex items-start gap-3"><span className="text-black/20">•</span> <span>Made in Italy</span></li>
                           </ul>
                        </div>
                     </details>

                     <details className="group border-t border-black py-6">
                        <summary className="flex justify-between items-center list-none cursor-pointer">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-black">Size & Fit</span>
                           <Plus size={12} className="group-open:hidden text-black/40" />
                           <Minus size={12} className="hidden group-open:block text-black/40" />
                        </summary>
                        <div className="mt-10 text-[10px] leading-[2] font-medium text-black/60 uppercase tracking-[0.15em]">
                           <p>The model is wearing a size M. Height: 188 cm. Oversized fit recommended to take your normal size.</p>
                        </div>
                     </details>

                     <details className="group border-t border-b border-black py-6">
                        <summary className="flex justify-between items-center list-none cursor-pointer">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-black">Sustainability</span>
                           <Plus size={12} className="group-open:hidden text-black/40" />
                           <Minus size={12} className="hidden group-open:block text-black/40" />
                        </summary>
                        <div className="mt-10 text-[10px] leading-[2] font-medium text-black/60 uppercase tracking-[0.15em]">
                           <p>Luzzio is committed to the sustainable management of its operations. 100% of our packaging is recyclable.</p>
                        </div>
                     </details>
                  </div>
               </div>
            </div>
         </div>

         {/* REVIEWS SECTION */}
         <div className="px-6 md:px-12 lg:px-20 py-20 border-t border-black">
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
            />
         </div>

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
      </div >
   );
}
