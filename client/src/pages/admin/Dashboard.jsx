import React, { useState, useEffect } from 'react';
import {
   TrendingUp,
   ShoppingBag,
   Users,
   DollarSign,
   ArrowRight,
   Loader2,
   X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, trend }) => (
   <div className="bg-black p-8 border border-black group hover:bg-white transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
         <div className="text-white group-hover:text-black transition-colors">
            <Icon size={20} strokeWidth={1.5} />
         </div>
         <span className="text-[9px] font-black group-hover:text-black text-white/40 uppercase tracking-[0.2em]">{trend}</span>
      </div>
      <p className="text-[10px] text-white/40 group-hover:text-black/40 uppercase tracking-widest font-black mb-2">{label}</p>
      <h3 className="text-4xl font-black tracking-tighter text-white group-hover:text-black transition-colors">{value}</h3>
   </div>
);

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
   if (!isOpen || !order) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-black shadow-2xl relative">
            <div className="p-8 bg-black flex justify-between items-center sticky top-0 z-10">
               <div className="space-y-1">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Acquisition Sequence Audit</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Sequence Audit</h2>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">UUID: {order._id.toUpperCase()}</p>
               </div>
               <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X />
               </button>
            </div>

            <div className="p-10 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-black">
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400">Current Status</p>
                     <p className="text-sm font-black uppercase tracking-widest bg-brand-grey inline-block px-3 py-1 border border-black">{order.status}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400">Client Entry</p>
                     <p className="text-sm font-black uppercase">{order.shippingAddress?.firstName && order.shippingAddress?.lastName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'Guest'}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase">{order.email}</p>
                  </div>
               </div>

               <div>
                  <p className="text-small-brand text-gray-400 mb-6 font-black uppercase">Archive Components</p>
                  <div className="border border-black divide-y divide-black text-black">
                     {order.orderItems.map((item, i) => (
                        <div key={i} className="flex p-6 gap-6 items-center">
                           <div className="w-16 aspect-[3/4] bg-white border border-black overflow-hidden shrink-0 shadow-sm">
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">VOL: {item.size} <span className="mx-2 text-gray-200">|</span> QTY: {item.qty} UNITS</p>
                           </div>
                           <p className="text-sm font-black text-black">LKR {(item.price * item.qty).toLocaleString()}.00</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="border-t border-black pt-10 flex justify-between items-end text-black">
                  <div className="space-y-1">
                     <p className="text-small-brand text-gray-400 font-black uppercase">Total Settlement Value</p>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-black">LKR {order.totalPrice.toLocaleString()}.00</div>
               </div>
            </div>
         </div>
      </div>
   );
};

const Dashboard = () => {
   const [stats, setStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [range, setRange] = useState('all');
   const { token } = useAuth();

   const fetchStats = async () => {
      setLoading(true);
      try {
         const res = await api.get(`/admin/stats?range=${range}`);
         setStats(res.data.data);
      } catch (err) {
         console.error('Failed to fetch stats:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (token) fetchStats();
   }, [token, range]);

   if (loading) return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-black" size={32} />
         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Archive Data...</p>
      </div>
   );

   const rangeLabels = {
      'today': 'PROTOCOL: TODAY',
      'week': 'PROTOCOL: 7 DAYS',
      'month': 'PROTOCOL: 30 DAYS',
      '6month': 'PROTOCOL: 180 DAYS',
      'year': 'PROTOCOL: 365 DAYS',
      'all': 'PROTOCOL: ALL TIME'
   };

   const dashboardStats = [
      { label: "Gross Revenue", value: `LKR ${stats?.grossRevenue?.toLocaleString()}`, icon: DollarSign, trend: rangeLabels[range] },
      { label: "Inventory Outflow", value: stats?.inventoryOutflow?.toLocaleString(), icon: ShoppingBag, trend: "VOLUME" },
      { label: "Client Registry", value: stats?.clientRegistry?.toLocaleString(), icon: Users, trend: "RECORDS" },
      { label: "Sales Momentum", value: stats?.archiveMomentum?.toLocaleString(), icon: TrendingUp, trend: "30D GAIN" },
   ];

   const ranges = [
      { id: 'today', label: 'Day' },
      { id: 'week', label: 'Week' },
      { id: 'month', label: 'Month' },
      { id: '6month', label: '6 Months' },
      { id: 'year', label: 'Year' },
      { id: 'all', label: 'All Time' },
   ];

   return (
      <div className="space-y-16">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-8">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">System Overview</p>
               <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Command Center</h1>
            </div>

            <div className="flex flex-col items-start md:items-end gap-6">
               <div className="flex items-center bg-brand-grey border border-black p-1">
                  {ranges.map((r) => (
                     <button
                        key={r.id}
                        onClick={() => setRange(r.id)}
                        className={cn(
                           "px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all",
                           range === r.id
                              ? "bg-black text-white"
                              : "text-black hover:bg-black/5"
                        )}
                     >
                        {r.label}
                     </button>
                  ))}
               </div>
               <div className="text-left md:text-right space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black">Synchronized</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Session: 0x{token?.slice(-4).toUpperCase() || 'SYS'}</p>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {dashboardStats.map((stat, index) => (
               <StatCard key={index} {...stat} />
            ))}
         </div>

         {/* Recent Activity */}
         <div className="bg-white">
            <div className="py-6 border-b border-black flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight">Recent Archives</h2>
                  <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase">Live</span>
               </div>
               <Link to="/admin/orders" className="text-small-brand border-b border-black pb-1 hover:opacity-50 transition-opacity">
                  View Full Registry
               </Link>
            </div>
            <div className="overflow-x-auto border border-black">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-brand-grey border-b border-black">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Order ID</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Client</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Timestamp</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Value</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Audit</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                     {stats?.recentOrders?.map((order) => (
                        <tr key={order._id} className="hover:bg-brand-grey transition-all group">
                           <td className="px-8 py-6 font-mono text-[11px] font-bold text-gray-400 group-hover:text-black">
                              LU-{order._id.slice(-8).toUpperCase()}
                           </td>
                           <td className="px-8 py-6 text-[11px] font-black uppercase tracking-tight">
                              {order.shippingAddress?.firstName && order.shippingAddress?.lastName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'Inconnu'}
                           </td>
                           <td className="px-8 py-6 text-[11px] font-bold text-gray-400 uppercase">
                              {new Date(order.createdAt).toLocaleDateString()}
                           </td>
                           <td className="px-8 py-6 text-[11px] font-black">LKR {order.totalPrice.toLocaleString()}.00</td>
                           <td className="px-8 py-6 text-right">
                              <button
                                 onClick={() => {
                                    setSelectedOrder(order);
                                    setIsModalOpen(true);
                                 }}
                                 className="p-2 border border-transparent hover:border-black hover:bg-white transition-all"
                              >
                                 <ArrowRight size={14} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <OrderDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
               setIsModalOpen(false);
               setSelectedOrder(null);
            }}
            order={selectedOrder}
         />
      </div>
   );
};

export default Dashboard;
