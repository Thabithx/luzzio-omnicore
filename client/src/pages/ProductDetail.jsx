import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import Meta from '../components/ui/Meta';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { cn } from '../utils/cn';

export function ProductDetail() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { addToCart } = useCart();
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedSize, setSelectedSize] = useState('');
   const [selectedColor, setSelectedColor] = useState('');
   const [adding, setAdding] = useState(false);

   const handleAddToCart = async () => {
      if (!selectedSize || (product.colors?.length > 0 && !selectedColor)) return;
      setAdding(true);
      await addToCart(product, 1, selectedSize, selectedColor);
      setAdding(false);
      navigate('/cart');
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
         <Meta title={`${product.name} | Luzzio`} />

         <div className="flex flex-col lg:flex-row">
            {/* LEFT: VISUAL GALLERY */}
            <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
               {/* Mobile Slider Container */}
               <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory scroll-smooth no-scrollbar relative group">
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

                  {/* Mobile Slider Indicators */}
                  <div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 flex items-center justify-center gap-2">
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {/* Simple CSS-based indicator or just use state if needed, but for minimalist feel we can just show total */}
                        Gallery / {productImages.length}
                     </span>
                  </div>
               </div>
            </div>

            {/* RIGHT: STICKY PRODUCT INFO */}
            <div className="w-full lg:w-[40%] px-6 md:px-12 lg:px-20 pt-16 md:pt-24 lg:pt-32 pb-24 lg:sticky lg:top-12 lg:h-[calc(100vh-48px)] overflow-y-auto no-scrollbar bg-white lg:border-l border-black">
               <div className="max-w-md mx-auto space-y-14">

                  {/* BRANDING & PRICE */}
                  <div className="space-y-4">
                     <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black">SPRING 26 / READY-TO-WEAR</p>
                     <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-[1.1] text-black">
                        {product.name}
                     </h1>
                     <p className="text-[11px] font-medium text-black/60 uppercase tracking-[0.15em] leading-relaxed">
                        {product.description?.split('.')[0]}
                     </p>
                     <div className="pt-2 flex flex-col">
                        {product.salePrice > 0 ? (
                           <>
                              <p className="text-lg font-bold text-black tracking-tighter">${product.salePrice}.00</p>
                              <p className="text-xs font-bold text-gray-400 line-through tracking-tight opacity-50">${product.price}.00</p>
                           </>
                        ) : (
                           <p className="text-lg font-bold text-black tracking-tighter">${product.price}.00</p>
                        )}
                     </div>
                  </div>

                  {/* COLOR SELECTION */}
                  {product.colors?.length > 0 && (
                     <div className="space-y-6 pt-12 border-t border-black">
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
                  <div className="space-y-6 pt-12 border-t border-black">
                     <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-black tracking-[0.15em] text-black">Size (US/EU)</span>
                        <button className="text-[9px] uppercase font-bold text-black/30 hover:text-black transition-colors border-b border-transparent hover:border-black">Size Guide</button>
                     </div>
                     <div className="relative group">
                        <select
                           value={selectedSize}
                           onChange={(e) => setSelectedSize(e.target.value)}
                           className="w-full border border-black px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] focus:outline-none appearance-none bg-white cursor-pointer group-hover:bg-gray-50 transition-colors"
                        >
                           <option value="">Select Size</option>
                           {product.sizes?.map(size => (
                              <option key={size} value={size}>{size}</option>
                           ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                           <ChevronDown size={14} className="text-black/40 group-hover:text-black transition-colors" />
                        </div>
                     </div>
                  </div>

                  {/* ADD TO BAG */}
                  <div className="space-y-4 pt-4">
                     <button
                        disabled={!selectedSize || (product.colors?.length > 0 && !selectedColor) || adding}
                        onClick={handleAddToCart}
                        className={cn(
                           "w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500",
                           (selectedSize && (product.colors?.length > 0 ? selectedColor : true))
                              ? "bg-black text-white hover:bg-stone-900 border border-black shadow-xl"
                              : "bg-gray-50 text-stone-300 cursor-not-allowed border border-gray-100"
                        )}
                     >
                        {adding ? "Initializing..." : "Add to Shopping Bag"}
                     </button>
                     <button
                        onClick={() => navigate('/products')}
                        className="w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black border border-black bg-white hover:bg-black hover:text-white transition-all duration-500"
                     >
                        Find in Store
                     </button>
                  </div>

                  {/* PRODUCT DETAILS ACCORDION */}
                  <div className="pt-24 space-y-0">
                     <details className="group border-t border-black py-8" open>
                        <summary className="flex justify-between items-center list-none cursor-pointer">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-black">Product Details</span>
                           <Plus size={12} className="group-open:hidden text-black/40" />
                           <Minus size={12} className="hidden group-open:block text-black/40" />
                        </summary>
                        <div className="mt-10 text-[10px] leading-[2] font-medium text-black/60 uppercase tracking-[0.15em] space-y-6 max-w-sm">
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

                     <details className="group border-t border-black py-8">
                        <summary className="flex justify-between items-center list-none cursor-pointer">
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] text-black">Size & Fit</span>
                           <Plus size={12} className="group-open:hidden text-black/40" />
                           <Minus size={12} className="hidden group-open:block text-black/40" />
                        </summary>
                        <div className="mt-10 text-[10px] leading-[2] font-medium text-black/60 uppercase tracking-[0.15em]">
                           <p>The model is wearing a size M. Height: 188 cm. Oversized fit recommended to take your normal size.</p>
                        </div>
                     </details>

                     <details className="group border-t border-b border-black py-8">
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
      </div>
   );
}
