import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Search, Menu, LogOut, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { NotificationBell } from '../NotificationBell';
import api from '../../services/api';

export function Navbar() {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [recommendations, setRecommendations] = useState({ products: [], categories: [] });
   const [loadingRecs, setLoadingRecs] = useState(false);
   const { cart } = useCart();
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   useEffect(() => {
      if (isSearchOpen) {
         fetchRecommendations();
      }
   }, [isSearchOpen]);

   const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
         const [prodRes, catRes] = await Promise.all([
            api.get('/products?limit=4'),
            api.get('/categories')
         ]);
         setRecommendations({
            products: prodRes.data.data.slice(0, 4),
            categories: catRes.data.data
         });
      } catch (err) {
         console.error('Error fetching search recommendations:', err);
      } finally {
         setLoadingRecs(false);
      }
   };

   const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

   const handleLogout = () => {
      logout();
      navigate('/login');
   };

   const handleSearch = (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
         navigate(`/products?search=${searchQuery}`);
         setIsSearchOpen(false);
      }
   };

   return (
      <nav className={cn(
         "fixed left-0 right-0 border-b border-black bg-white transition-all duration-300",
         isMenuOpen ? "z-[400] top-0" : "z-[100] top-[28px] md:top-8"
      )}>
         <div className="max-w-[1920px] mx-auto px-4 md:px-10 h-14 md:h-12 flex items-center justify-between">
            {/* Left: Navigation Pages */}
            <div className="hidden lg:flex flex-1 items-center space-x-6 min-w-0">
               <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Contact</Link>
               <Link to="/faq" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">FAQ</Link>
               <Link to="/shipping-policy" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Shipping</Link>
               <Link to="/return-policy" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Returns</Link>
               <Link to="/exchange-policy" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Exchange</Link>
               <Link to="/refund-policy" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Refund</Link>
               <Link to="/privacy-policy" className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity whitespace-nowrap">Privacy</Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="lg:hidden" onClick={() => setIsMenuOpen(true)}>
               <Menu size={20} />
            </button>

            {/* Center: Branding */}
            <div className="flex-none flex justify-center">
               <Link
                  to="/"
                  className="text-xl md:text-2xl font-black uppercase tracking-[0.4em] text-black"
               >
                  Luzzio
               </Link>
            </div>

            {/* Right: Tools & Bag */}
            <div className="flex-1 flex items-center justify-end space-x-6 md:space-x-8 min-w-0">
               <div className="hidden md:flex items-center space-x-8">
                  <Link to={user?.role === 'admin' ? '/admin' : '/profile'} className="flex items-center text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50">
                     <User size={16} strokeWidth={2} />
                  </Link>
               </div>

               <div className="flex items-center gap-4">
                  <button
                     onClick={() => setIsSearchOpen(true)}
                     className="p-1 hover:opacity-50 transition-opacity"
                  >
                     <Search size={18} strokeWidth={1.5} />
                  </button>
                  <NotificationBell />
                  <Link to="/cart" className="p-1 hover:opacity-50 transition-opacity relative">
                     <ShoppingBag size={18} strokeWidth={1.5} />
                     {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 text-[8px] font-black w-4 h-4 flex items-center justify-center bg-black text-white rounded-full">
                           {cartCount}
                        </span>
                     )}
                  </Link>
               </div>
            </div>
         </div>

         {/* SEARCH OVERLAY */}
         {isSearchOpen && (
            <div className="absolute inset-x-0 top-0 h-14 md:h-12 bg-white flex items-center px-4 md:px-10 z-[120] border-b border-black animate-in fade-in slide-in-from-top duration-300">
               <form onSubmit={handleSearch} className="flex-1 flex items-center gap-4">
                  <Search size={18} className="text-black/30" />
                  <input
                     autoFocus
                     type="text"
                     placeholder="Search the archive..."
                     className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-[13px] font-black tracking-wider outline-none placeholder:text-black/20"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </form>
               <button onClick={() => setIsSearchOpen(false)} className="ml-4 hover:opacity-50 transition-opacity">
                  <X size={20} />
               </button>

               {/* Recommendations Dropdown */}
               <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-black p-6 md:p-10 z-[110] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
                     {/* Products */}
                     <div className="md:col-span-3 space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 pb-4 border-b border-black/10 flex justify-between items-center">
                           Recent Archive
                           <Link to="/products" onClick={() => setIsSearchOpen(false)} className="text-black hover:opacity-50 flex items-center gap-2">View All <ArrowRight size={12} /></Link>
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                           {loadingRecs ? (
                              [1, 2, 3, 4].map(i => (
                                 <div key={i} className="space-y-4 animate-pulse">
                                    <div className="aspect-[3/4] bg-brand-grey border border-black/5" />
                                    <div className="h-2 w-2/3 bg-brand-grey" />
                                 </div>
                              ))
                           ) : recommendations.products.map(product => (
                              <Link
                                 key={product._id}
                                 to={`/products/${product._id}`}
                                 onClick={() => setIsSearchOpen(false)}
                                 className="group space-y-4"
                              >
                                 <div className="aspect-[3/4] bg-brand-grey border border-black overflow-hidden relative">
                                    <img
                                       src={product.images[0]}
                                       alt=""
                                       className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                 </div>
                                 <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black group-hover:opacity-50 transition-opacity">
                                       {product.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">${product.price}.00</p>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Categories */}
                     <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 pb-4 border-b border-black/10">Categories</h3>
                        <div className="flex flex-col space-y-4">
                           {loadingRecs ? (
                              [1, 2, 3].map(i => <div key={i} className="h-4 w-full bg-brand-grey animate-pulse" />)
                           ) : recommendations.categories.map(category => (
                              <Link
                                 key={category._id}
                                 to={`/products?category=${category.name.toLowerCase()}`}
                                 onClick={() => setIsSearchOpen(false)}
                                 className="text-[10px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-opacity flex justify-between items-center group"
                              >
                                 {category.name}
                                 <ArrowRight size={10} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                              </Link>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Balenciaga-Style Mobile Menu Overlay */}
         {isMenuOpen && (
            <div className="fixed inset-0 bg-white z-[300] flex flex-col animate-in fade-in slide-in-from-left duration-500 overflow-y-auto">
               {/* Menu Header */}
               <div className="flex justify-between items-center px-6 h-14 border-b border-black">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-black uppercase tracking-[0.4em]">Luzzio</Link>
                  <button onClick={() => setIsMenuOpen(false)}>
                     <X size={24} strokeWidth={1} />
                  </button>
               </div>


               {/* Navigation Links - Aligned with Desktop */}
               <div className="flex flex-col border-b border-black">
                  {[
                     { name: 'Contact', link: '/contact' },
                     { name: 'FAQ', link: '/faq' },
                     { name: 'Shipping', link: '/shipping-policy' },
                     { name: 'Returns', link: '/return-policy' },
                     { name: 'Exchange Policy', link: '/exchange-policy' },
                     { name: 'Refund Policy', link: '/refund-policy' },
                     { name: 'Privacy Policy', link: '/privacy-policy' }
                  ].map((item, idx) => (
                     <Link
                        key={idx}
                        to={item.link}
                        className="flex justify-between items-center px-6 py-5 border-b border-black/5 last:border-b-0 group"
                        onClick={() => setIsMenuOpen(false)}
                     >
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:opacity-50">{item.name}</span>
                        <ArrowRight size={14} className="text-black/30" />
                     </Link>
                  ))}
               </div>

               {/* Utility Links */}
               <div className="mt-8 px-6 pb-20 flex flex-col space-y-5">
                  <div className="flex flex-col space-y-4">
                     <Link to="/profile" className="text-[9px] font-black uppercase tracking-widest hover:opacity-50" onClick={() => setIsMenuOpen(false)}>Account Archive</Link>
                     {user ? (
                        <button onClick={handleLogout} className="text-start text-[9px] font-black uppercase tracking-widest hover:opacity-50">Logout Session</button>
                     ) : (
                        <Link to="/login" className="text-[9px] font-black uppercase tracking-widest hover:opacity-50" onClick={() => setIsMenuOpen(false)}>Register / Sign In</Link>
                     )}
                     <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Country / Region: International Version</span>
                     <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Language: English</span>
                  </div>
               </div>
            </div>
         )}
      </nav>
   );
}
