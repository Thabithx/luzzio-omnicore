import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export function ProductCard({ product }) {
   const { addToCart } = useCart();
   const [added, setAdded] = useState(false);
   const imageUrl = product.images?.[0] || 'https://placehold.co/600x800/E5E7EB/000000?text=Product';

   const handleQuickAdd = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const defaultSize = product.sizes?.[0] || 'OS';
      addToCart(product, 1, defaultSize);

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
   };

   return (
      <div className="group relative cursor-pointer transition-all duration-500 hover:bg-brand-grey/50 p-6 h-full">
         <Link to={`/products/${product._id}`}>
            <div className="aspect-[3/4] bg-white relative overflow-hidden">
               <img
                  src={imageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain transition-all duration-700 bg-white"
               />
            </div>

            <div className="mt-6 flex flex-col items-center text-center space-y-4">
               <div className="space-y-1">
                  <h3 className="text-small-brand group-hover:opacity-50 transition-opacity">
                     {product.name}
                  </h3>
                  <div className="flex flex-col items-center">
                     {product.salePrice > 0 ? (
                        <>
                           <p className="text-sm font-black tracking-tight text-black">${product.salePrice}</p>
                           <p className="text-[10px] font-black text-gray-400 line-through opacity-50">${product.price}</p>
                        </>
                     ) : (
                        <p className="text-sm font-black tracking-tight">${product.price}</p>
                     )}
                  </div>
               </div>

               <button
                  onClick={handleQuickAdd}
                  className={cn(
                     "w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] border border-black transition-all duration-500",
                     added
                        ? "bg-black text-white"
                        : "bg-transparent text-black hover:bg-black hover:text-white"
                  )}
               >
                  <span className="flex items-center justify-center gap-2">
                     {added ? (
                        <>
                           <Check size={12} strokeWidth={3} />
                           Archived
                        </>
                     ) : (
                        "Add to Bag"
                     )}
                  </span>
               </button>
            </div>
         </Link>
      </div>
   );
}
