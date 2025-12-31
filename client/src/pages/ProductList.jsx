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
         case 'under500': return { min: 0, max: 500 };
         case '500-1000': return { min: 500, max: 1000 };
         case '1000-5000': return { min: 1000, max: 5000 };
         case '5000+': return { min: 5000, max: Infinity };
         default: return null;
      }
   };

   const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategory === 'all' ||
         p.category?.name?.toLowerCase() === activeCategory.toLowerCase() ||
         p.category?._id === activeCategory ||
         p.category === activeCategory;

      const matchesSearch = searchQuery === '' ||
         p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Price filter
      let matchesPrice = true;
      if (priceFilter !== 'all') {
         const range = getPriceRange(priceFilter);
         matchesPrice = p.price >= range.min && p.price <= range.max;
      }

      // Color filter (simplified - matches if product name contains color keyword)
      let matchesColor = true;
      if (colorFilter !== 'all') {
         const colorKeywords = {
            'noir': ['black', 'noir'],
            'blanc': ['white', 'blanc'],
            'gris': ['gray', 'grey', 'gris', 'silver'],
            'beige': ['beige', 'tan', 'cream']
         };
         const keywords = colorKeywords[colorFilter] || [];
         matchesColor = keywords.some(keyword =>
            p.name.toLowerCase().includes(keyword) ||
            p.description?.toLowerCase().includes(keyword)
         );
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
         <div className="px-10 mb-8 md:mb-12 flex flex-col items-center">
            <h1 className="text-6xl md:text-[10vw] font-black uppercase tracking-tighter leading-none mb-4">
               {activeCategory}
            </h1>
            <div className="flex items-center space-x-10 text-small-brand text-gray-400">
               <button onClick={() => setActiveCategory('all')} className={activeCategory === 'all' ? 'text-black font-black' : ''}>All</button>
               {categories.map(cat => (
                  <button
                     key={cat._id}
                     onClick={() => setActiveCategory(cat.name.toLowerCase())}
                     className={activeCategory === cat.name.toLowerCase() ? 'text-black font-black' : ''}
                  >
                     {cat.name}
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
                           onClick={() => setPriceFilter('under500')}
                           className={`block text-small-brand ${priceFilter === 'under500' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           Under $500
                        </button>
                        <button
                           onClick={() => setPriceFilter('500-1000')}
                           className={`block text-small-brand ${priceFilter === '500-1000' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           $500 - $1000
                        </button>
                        <button
                           onClick={() => setPriceFilter('1000-5000')}
                           className={`block text-small-brand ${priceFilter === '1000-5000' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           $1000 - $5000
                        </button>
                        <button
                           onClick={() => setPriceFilter('5000+')}
                           className={`block text-small-brand ${priceFilter === '5000+' ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                        >
                           $5000+
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
                           onClick={() => setColorFilter('noir')}
                           className={`block text-small-brand ${colorFilter === 'noir' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Noir
                        </button>
                        <button
                           onClick={() => setColorFilter('blanc')}
                           className={`block text-small-brand ${colorFilter === 'blanc' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Blanc
                        </button>
                        <button
                           onClick={() => setColorFilter('gris')}
                           className={`block text-small-brand ${colorFilter === 'gris' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Gris
                        </button>
                        <button
                           onClick={() => setColorFilter('beige')}
                           className={`block text-small-brand ${colorFilter === 'beige' ? 'text-black font-black' : 'text-gray-500 hover:text-black'} text-left`}
                        >
                           Beige
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
