import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
   LayoutDashboard,
   Package,
   Layers,
   ShoppingBag,
   Users,
   MessageSquare,
   HelpCircle,
   Settings,
   LogOut
} from 'lucide-react';
import { cn } from '../utils/cn';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
   <Link
      to={to}
      className={cn(
         "flex items-center gap-4 px-8 py-5 transition-all duration-300 relative group",
         active
            ? "bg-black text-white"
            : "text-gray-400 hover:text-black hover:bg-brand-grey"
      )}
   >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      {active && (
         <div className="absolute right-0 top-0 bottom-0 w-1 bg-white" />
      )}
   </Link>
);

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ children }) => {
   const location = useLocation();
   const { logout, user, loading: authLoading } = useAuth();
   const navigate = useNavigate();

   React.useEffect(() => {
      if (!authLoading && (!user || user.role !== 'admin')) {
         navigate('/login');
      }
   }, [user, authLoading, navigate]);

   const handleLogout = () => {
      logout();
      navigate('/login');
   };

   const menuItems = [
      { to: "/admin", icon: LayoutDashboard, label: "Command Center" },
      { to: "/admin/products", icon: Package, label: "Inventory Registry" },
      { to: "/admin/categories", icon: Layers, label: "Classification logic" },
      { to: "/admin/orders", icon: ShoppingBag, label: "Fulfillment sequences" },
      { to: "/admin/users", icon: Users, label: "Client Registry" },
      { to: "/admin/faq", icon: HelpCircle, label: "FAQ Management" },
      { to: "/admin/contact", icon: MessageSquare, label: "Contact Messages" },
      { to: "/admin/settings", icon: Settings, label: "Global Settings" },
   ];

   return (
      <div className="flex min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white max-w-full overflow-x-hidden">
         {/* Sidebar */}
         <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-black z-50 print:hidden">
            <div className="p-10 border-b border-black">
               <Link to="/" className="block">
                  <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Luzzio</h1>
                  <p className="text-[9px] text-gray-400 mt-2 font-black uppercase tracking-[0.3em]">Administrator</p>
               </Link>
            </div>

            <nav className="mt-8">
               {menuItems.map((item) => (
                  <SidebarItem
                     key={item.to}
                     to={item.to}
                     icon={item.icon}
                     label={item.label}
                     active={item.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.to)}
                  />
               ))}
            </nav>

            <div className="absolute bottom-0 w-full p-8 border-t border-black">
               <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-4 text-gray-400 hover:text-red-600 transition-all group border-none bg-transparent"
               >
                  <LogOut size={18} strokeWidth={2} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deauthorize Session</span>
               </button>
            </div>
         </aside>

         {/* Main Content */}
         <main className="flex-1 ml-0 md:ml-72 min-h-screen relative print:ml-0 print:min-h-0 overflow-x-hidden">
            <header className="px-6 md:px-12 py-10 border-b border-black flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-40 print:hidden">
               <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                     Luzzio / {menuItems.find(i => i.to === location.pathname)?.label || "Protocol"}
                  </h2>
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-grey border border-black">
                     <div className="w-1.5 h-1.5 bg-black animate-pulse"></div>
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black">System Nominal</p>
                  </div>
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-[10px] font-black tracking-tight border border-black shadow-sm">
                     ADM
                  </div>
               </div>
            </header>

            <div className="p-6 md:p-12 w-full mx-auto print:p-0">
               {children}
            </div>
         </main>
      </div>
   );
};

export default AdminLayout;
