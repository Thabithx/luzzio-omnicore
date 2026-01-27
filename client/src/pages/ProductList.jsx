import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ui/ProductCard';
import Meta from '../components/ui/Meta';
import { ChevronDown, Filter } from 'lucide-react';
import api from '../services/api';

export function ProductList() {
   const [searchParams, setSearchParams] = useSearchParams();
   const [products, setProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   const [sortBy, setSortBy] = useState('newest');
   const [priceFilter, setPriceFilter] = useState('all');
   const [colorFilter, setColorFilter] = useState('all');
   const [isSortOpen, setIsSortOpen] = useState(false);

   const activeCategory = searchParams.get('category') || 'all';
   const searchQuery = searchParams.get('search') || '';

   const setActiveCategory = (cat) => {
      const newParams = new URLSearchParams(searchParams);
      if (cat === 'all') {
         newParams.delete('category');
      } else {
         newParams.set('category', cat);
      }
      setSearchParams(newParams);
   };

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [prodRes, catRes] = await Promise.all([
               api.get('/products'),
               api.get('/categories')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
         } catch (err) {
            console.error('Error fetching data:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const getPriceRange = (filter) => {
      switch (filter) {
         case 'under10k': return { min: 0, max: 10000 };
         case '10k-25k': return { min: 10000, max: 25000 };
         case '25k-50k': return { min: 25000, max: 50000 };
         case '50k+': return { min: 50000, max: Infinity };
         default: return null;
      }
   };

   const filteredProducts = products.filter(p => {
      // Category filtering - support both new categories array and old single category
      let matchesCategory = activeCategory === 'all';

      if (!matchesCategory) {
         if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
            // New structure: check if any category matches
            matchesCategory = p.categories.some(cat =>
               cat?.name?.toLowerCase() === activeCategory.toLowerCase() ||
               cat?._id === activeCategory ||
               cat === activeCategory
            );
         } else if (p.category) {
            // Fallback for old single category structure
            matchesCategory =
               p.category?.name?.toLowerCase() === activeCategory.toLowerCase() ||
               p.category?._id === activeCategory ||
               p.category === activeCategory;
         }
      }

      // Search filtering - search across all categories
      let matchesSearch = searchQuery === '' ||
         p.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch && searchQuery !== '') {
         // Search in categories array
         if (p.categories && Array.isArray(p.categories)) {
            matchesSearch = p.categories.some(cat =>
               cat?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
         } else if (p.category) {
            // Fallback for old structure
            matchesSearch = p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
         }
      }

      // Price filter
      let matchesPrice = true;
      if (priceFilter !== 'all') {
         const range = getPriceRange(priceFilter);
         matchesPrice = p.price >= range.min && p.price <= range.max;
      }

      // Color filter (Improved - matches colors array + name/description keywords)
      let matchesColor = true;
      if (colorFilter !== 'all') {
         // 1. Check if color exists in the product's colors array (most accurate)
         const inColorsArray = p.colors?.some(c => c.toLowerCase() === colorFilter.toLowerCase());

         if (inColorsArray) {
            matchesColor = true;
         } else {
            // 2. Fallback to keyword matching in name/description
            const colorKeywords = {
               'black': ['black', 'noir', 'nero', 'dark'],
               'white': ['white', 'blanc', 'bianco', 'snow'],
               'gray': ['gray', 'grey', 'gris', 'silver', 'slate'],
               'beige': ['beige', 'tan', 'cream', 'sand'],
               'blue': ['blue', 'navy', 'bleu', 'azure'],
               'brown': ['brown', 'chocolate', 'taupe', 'coffee'],
               'red': ['red', 'rouge', 'crimson', 'burgundy'],
               'green': ['green', 'olive', 'forest', 'emerald']
            };
            const keywords = colorKeywords[colorFilter.toLowerCase()] || [];
            matchesColor = keywords.some(keyword =>
               p.name.toLowerCase().includes(keyword) ||
               p.description?.toLowerCase().includes(keyword)
            );
         }
      }

      return matchesCategory && matchesSearch && matchesPrice && matchesColor;
   });

   // Sort products
   const sortedProducts = [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
         case 'price-low':
            return a.price - b.price;
         case 'price-high':
            return b.price - a.price;
         case 'newest':
         default:
            return new Date(b.createdAt) - new Date(a.createdAt);
      }
   });

   if (loading) return <div className="min-h-screen flex items-center justify-center text-small-brand animate-pulse">Synchronizing Inventory...</div>;

   return (
      <div className="min-h-screen bg-white pb-24">
         <Meta title="Collection" description="Browse the Luzzio luxury collection." />

         {/* CATEGORY HEADER */}
         <div className="px-6 md:px-10 mb-12 md:mb-16 flex flex-col items-center">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-8 text-center max-w-4xl">
               {activeCategory === 'all' ? 'The Collection' : activeCategory.replace(/[+-]/g, ' ')}
            </h1>
            <div className="flex flex-wrap justify-center gap-x-6 md:gap-x-12 gap-y-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
               <button
                  onClick={() => setActiveCategory('all')}
                  className={`transition-colors hover:text-black ${activeCategory === 'all' ? 'text-black' : ''}`}
               >
                  ALL ITEMS
               </button>
               {categories.map(cat => (
                  <button
                     key={cat._id}
                     onClick={() => setActiveCategory(cat.name.toLowerCase())}
                     className={`transition-colors hover:text-black ${activeCategory === cat.name.toLowerCase() ? 'text-black' : ''}`}
                  >
                     {cat.name.toUpperCase()}
                  </button>
               ))}
            </div>
         </div>

         {/* FILTER BAR */}
         <div className="border-y border-black px-10 py-4 flex justify-between items-center bg-white sticky top-20 z-40">
            <div className="flex items-center gap-8">
               <span className="text-small-brand text-gray-400">{sortedProducts.length} Products</span>
               <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 text-small-brand hover:text-black transition-colors"
               >
                  <Filter size={12} /> Filter {isFilterOpen && '×'}
               </button>
            </div>
            <div className="relative">
               <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 text-small-brand hover:text-black"
               >
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}
                  <ChevronDown size={12} />
               </button>
               {isSortOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-black min-w-[200px] shadow-xl z-50">
                     <button
                        onClick={() => { setSortBy('newest'); setIsSortOpen(false); }}
                        className="block w-full text-left px-6 py-3 text-small-brand hover:bg-brand-grey"
                     >
                        Newest
                     </button>
                     <button
                        onClick={() => { setSortBy('price-low'); setIsSortOpen(false); }}
                        className="block w-full text-left px-6 py-3 text-small-brand hover:bg-brand-grey border-t border-black"
                     >
                        Price: Low to High
                     </button>
                     <button
                        onClick={() => { setSortBy('price-high'); setIsSortOpen(false); }}
                        className="block w-full text-left px-6 py-3 text-small-brand hover:bg-brand-grey border-t border-black"
                     >
                        Price: High to Low
                     </button>
                  </div>
               )}
            </div>
         </div>

         <div className="flex flex-col lg:flex-row px-0">
            {/* Filter Sidebar */}
            <div className={`overflow-hidden transition-all duration-500 bg-brand-grey ${isFilterOpen ? 'w-full lg:w-80 h-auto' : 'w-0 lg:w-0 h-0 lg:h-auto'}`}>
               <div className="p-10 space-y-12 min-w-[320px]">
                  <div>
                     <p className="text-small-brand text-black mb-6">Price Range</p>
                     <div className="space-y-3">
                        <button
                           onClick={() => setPriceFilter('all')}
                           className={`block text-small-brand ${priceFilter === 'all' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           All Prices
                        </button>
                        <button
                           onClick={() => setPriceFilter('under10k')}
                           className={`block text-small-brand ${priceFilter === 'under10k' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           Under LKR 10,000
                        </button>
                        <button
                           onClick={() => setPriceFilter('10k-25k')}
                           className={`block text-small-brand ${priceFilter === '10k-25k' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           LKR 10,000 - 25,000
                        </button>
                        <button
                           onClick={() => setPriceFilter('25k-50k')}
                           className={`block text-small-brand ${priceFilter === '25k-50k' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           LKR 25,000 - 50,000
                        </button>
                        <button
                           onClick={() => setPriceFilter('50k+')}
                           className={`block text-small-brand ${priceFilter === '50k+' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           LKR 50,000+
                        </button>
                     </div>
                  </div>
                  <div>
                     <p className="text-small-brand text-black mb-6">Color</p>
                     <div className="grid grid-cols-2 gap-4">
                        <button
                           onClick={() => setColorFilter('all')}
                           className={`block text-small-brand ${colorFilter === 'all' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           All
                        </button>
                        <button
                           onClick={() => setColorFilter('black')}
                           className={`block text-small-brand ${colorFilter === 'black' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Black
                        </button>
                        <button
                           onClick={() => setColorFilter('white')}
                           className={`block text-small-brand ${colorFilter === 'white' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           White
                        </button>
                        <button
                           onClick={() => setColorFilter('gray')}
                           className={`block text-small-brand ${colorFilter === 'gray' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Gray
                        </button>
                        <button
                           onClick={() => setColorFilter('beige')}
                           className={`block text-small-brand ${colorFilter === 'beige' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Beige
                        </button>
                        <button
                           onClick={() => setColorFilter('blue')}
                           className={`block text-small-brand ${colorFilter === 'blue' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Blue
                        </button>
                        <button
                           onClick={() => setColorFilter('brown')}
                           className={`block text-small-brand ${colorFilter === 'brown' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Brown
                        </button>
                        <button
                           onClick={() => setColorFilter('red')}
                           className={`block text-small-brand ${colorFilter === 'red' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Red
                        </button>
                        <button
                           onClick={() => setColorFilter('green')}
                           className={`block text-small-brand ${colorFilter === 'green' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Green
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1">
               <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-l border-black">
                  {sortedProducts.map(product => (
                     <div key={product._id} className="border-b border-r border-black">
                        <ProductCard product={product} />
                     </div>
                  ))}
               </div>

               {sortedProducts.length === 0 && (
                  <div className="py-40 text-center">
                     <p className="text-small-brand text-gray-400">Inventory not found for this selection.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
