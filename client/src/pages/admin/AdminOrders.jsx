import React, { useState, useEffect } from 'react';
import { Eye, Search, X, Package, MapPin, CreditCard, Clock, Printer, CheckSquare, Square } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrderDetailsModal = ({ isOpen, onClose, order, onTrackingUpdate }) => {
   const [trackingNums, setTrackingNums] = useState({});

   useEffect(() => {
      if (order) {
         const initial = {};
         order.orderItems.forEach(item => {
            initial[item._id] = item.trackingNumber || '';
         });
         setTrackingNums(initial);
      }
   }, [order]);

   if (!isOpen || !order) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-black shadow-2xl">
            <div className="p-8 bg-black flex justify-between items-center sticky top-0 z-10">
               <div className="space-y-1">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Acquisition Sequence Audit</p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Sequence Audit</h2>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">UUID: {order._id.toUpperCase()}</p>
               </div>
               <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="p-10 space-y-12">
               {/* Order Status & Info */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <Clock size={12} strokeWidth={2.5} /> Current Status
                     </p>
                     <p className="text-sm font-black uppercase tracking-widest bg-brand-grey inline-block px-3 py-1 border border-black">{order.status}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <CreditCard size={12} strokeWidth={2.5} /> Settlement Method
                     </p>
                     <p className="text-sm font-black uppercase tracking-widest">{order.paymentMethod}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-small-brand text-gray-400 flex items-center gap-2">
                        <MapPin size={12} strokeWidth={2.5} /> Destination Logic
                     </p>
                     <p className="text-sm font-black uppercase leading-tight">
                        {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                     </p>
                  </div>
               </div>

               {/* Client Registry Info */}
               <div className="p-8 bg-brand-grey border border-black">
                  <p className="text-small-brand text-gray-400 mb-4">Client Registry Reference</p>
                  <div className="flex flex-col md:flex-row md:items-center gap-10">
                     <div>
                        <p className="text-sm font-black uppercase tracking-tighter">{order.shippingAddress?.firstName && order.shippingAddress?.lastName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'GUEST CLIENT'}</p>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">{order.email || 'UNIDENTIFIED'}</p>
                     </div>
                     <div className="md:border-l border-black md:pl-10">
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed">
                           {order.shippingAddress.address}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Archive Items */}
               <div>
                  <p className="text-small-brand text-gray-400 mb-6">Archive Components</p>
                  <div className="border border-black divide-y divide-black">
                     {order.orderItems.map((item, i) => (
                        <div key={i} className="flex p-6 gap-6 items-center hover:bg-brand-grey transition-colors">
                           <div className="w-16 aspect-[3/4] bg-white border border-black overflow-hidden shrink-0 shadow-sm">
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">VOL: {item.size} <span className="mx-2 text-gray-200">|</span> QTY: {item.qty} UNITS</p>
                              <div className="mt-4 flex gap-2">
                                 <input
                                    type="text"
                                    placeholder="Tracking #"
                                    value={trackingNums[item._id] || ''}
                                    onChange={(e) => setTrackingNums({ ...trackingNums, [item._id]: e.target.value })}
                                    className="text-[9px] font-black tracking-widest bg-brand-grey border border-black px-3 py-1.5 w-full max-w-[200px] focus:outline-none"
                                 />
                                 <button
                                    onClick={() => onTrackingUpdate(order._id, item._id, trackingNums[item._id])}
                                    className="px-4 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-all"
                                 >
                                    Register
                                 </button>
                              </div>
                           </div>
                           <p className="text-sm font-black text-black">${item.price * item.qty}.00</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Financial Settlement */}
               <div className="border-t border-black pt-10 flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-small-brand text-gray-400">Total Settlement Value</p>
                     <p className="text-[10px] text-gray-300 font-bold uppercase">Incl. Digital VAT & Logistics</p>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-black">${order.totalPrice}.00</div>
               </div>
            </div>
         </div>
      </div>
   );
};

const AdminOrders = () => {
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [selectedIds, setSelectedIds] = useState([]);
   const { token } = useAuth();

   const fetchOrders = async () => {
      try {
         setLoading(true);
         const res = await api.get('/orders');
         setOrders(res.data.data);
      } catch (err) {
         console.error('Error fetching orders:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (token) fetchOrders();
   }, [token]);

   const handleTrackingUpdate = async (orderId, itemId, trackingNumber) => {
      try {
         await api.put(`/orders/${orderId}/item/${itemId}/tracking`, { trackingNumber });
         fetchOrders();
         // Optionally update the selected order state to reflect changes without closing modal if needed, 
         // but fetchOrders + re-selecting might be complex. Let's just update local state if we want persistence in modal.
         const res = await api.get('/orders');
         const updatedOrder = res.data.data.find(o => o._id === orderId);
         setSelectedOrder(updatedOrder);
      } catch (err) {
         console.error('Error updating tracking number:', err);
         alert('FAILED TO REGISTER TRACKING SEQUENCE.');
      }
   };

   const handleStatusUpdate = async (id, status) => {
      try {
         await api.put(`/orders/${id}/status`, { status });
         fetchOrders();
      } catch (err) {
         console.error('Error updating order status:', err);
      }
   };

   const filteredOrders = orders.filter(order =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const toggleSelectAll = () => {
      if (selectedIds.length === filteredOrders.length) {
         setSelectedIds([]);
      } else {
         setSelectedIds(filteredOrders.map(o => o._id));
      }
   };

   const toggleSelectOne = (id) => {
      setSelectedIds(prev =>
         prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
   };

   const handlePrint = () => {
      window.print();
   };

   if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
         <p className="text-small-brand text-gray-400 animate-pulse tracking-[0.5em] font-black uppercase">Syncing Order Archive...</p>
      </div>
   );
   return (
      <div className="space-y-12 pb-40">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-8">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">Digital Logistics</p>
               <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Order Fulfillment</h1>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-4">
               {selectedIds.length > 0 && (
                  <button
                     onClick={handlePrint}
                     className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-all flex items-center gap-3"
                  >
                     <Printer size={14} />
                     Print Selected ({selectedIds.length})
                  </button>
               )}
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black">{orders.length} Sequences</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Real-Time Refresh Active</p>
               </div>
            </div>
         </div>

         {/* Search bar */}
         <div className="w-full max-w-xl relative">
            <Input
               placeholder="Identify sequence (ID, Client, Email)..."
               className="pl-14 py-6 border-black focus:border-black rounded-none text-small-brand bg-brand-grey/50"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={18} />
         </div>

         {/* Table Section */}
         <div className="bg-white border border-black">
            <div className="overflow-x-auto w-full max-w-full">
               <table className="w-full text-left min-w-[1000px]">
                  <thead>
                     <tr className="bg-brand-grey border-b border-black">
                        <th className="px-8 py-5 w-10">
                           <button onClick={toggleSelectAll} className="text-black">
                              {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                                 <CheckSquare size={16} strokeWidth={2.5} />
                              ) : (
                                 <Square size={16} strokeWidth={2.5} />
                              )}
                           </button>
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Sequence ID</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Client Entry</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Protocol Status</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Components</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black">Settlement</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black text-right">Audit</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                     {filteredOrders.map((order) => (
                        <tr key={order._id} className={cn("hover:bg-brand-grey transition-all group", selectedIds.includes(order._id) && "bg-brand-grey")}>
                           <td className="px-8 py-8">
                              <button onClick={() => toggleSelectOne(order._id)} className="text-black/20 group-hover:text-black">
                                 {selectedIds.includes(order._id) ? (
                                    <CheckSquare size={16} strokeWidth={2.5} className="text-black" />
                                 ) : (
                                    <Square size={16} strokeWidth={2.5} />
                                 )}
                              </button>
                           </td>
                           <td className="px-8 py-8">
                              <div className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">LU-{order._id.slice(-8).toUpperCase()}</div>
                           </td>
                           <td className="px-8 py-8">
                              <div className="text-[11px] font-black uppercase tracking-tight">{order.shippingAddress?.firstName && order.shippingAddress?.lastName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'GUEST CLIENT'}</div>
                              <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{order.email || 'N/A'}</div>
                           </td>
                           <td className="px-8 py-8">
                              <select
                                 value={order.status}
                                 onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                 className="text-[9px] font-black uppercase tracking-widest bg-white border border-black px-3 py-1.5 focus:border-black focus:ring-0 appearance-none rounded-none"
                              >
                                 <option value="pending">PENDING</option>
                                 <option value="processing">PROCESSING</option>
                                 <option value="packaged">PACKAGED</option>
                                 <option value="out for delivery">OUT FOR DELIVERY</option>
                                 <option value="delivered">DELIVERED</option>
                                 <option value="completed">COMPLETED</option>
                                 <option value="cancelled">CANCELLED</option>
                                 <option value="returned">RETURNED</option>
                              </select>
                           </td>
                           <td className="px-8 py-8 text-[11px] font-black uppercase tracking-widest text-gray-400">
                              {order.orderItems?.length} Products
                           </td>
                           <td className="px-8 py-8 text-[11px] font-black text-black">${order.totalPrice}.00</td>
                           <td className="px-8 py-8 text-right">
                              <div className="flex justify-end gap-1">
                                 <button
                                    className="p-3 text-black/30 hover:text-black hover:bg-white border border-transparent hover:border-black transition-all"
                                    onClick={() => {
                                       setSelectedOrder(order);
                                       setIsModalOpen(true);
                                    }}
                                 >
                                    <Eye size={16} strokeWidth={1.5} />
                                 </button>
                              </div>
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
            onTrackingUpdate={handleTrackingUpdate}
         />

         {/* PRINTABLE AREA */}
         <div className="hidden print:block print:m-0 print:p-0">
            <style>
               {`
               @media print {
                  @page {
                     size: A4;
                     margin: 10mm;
                  }
                  /* Global print reset to bypass dashboard constraints */
                  html, body {
                     margin: 0 !important;
                     padding: 0 !important;
                     width: 100% !important;
                     height: auto !important;
                     overflow: visible !important;
                     background: white !important;
                  }
                  body * {
                     visibility: hidden !important;
                  }
                  #printable-registry, #printable-registry * {
                     visibility: visible !important;
                  }
                  #printable-registry {
                     position: absolute !important;
                     left: 0 !important;
                     top: 0 !important;
                     width: 100% !important;
                     height: auto !important;
                     margin: 0 !important;
                     padding: 0 !important;
                     background: white !important;
                     z-index: 9999999 !important;
                     box-sizing: border-box !important;
                  }
                  .print-page-break {
                     page-break-after: always;
                     break-after: page;
                     display: block;
                  }
                  .label-body {
                     width: 100%;
                     height: auto;
                     page-break-inside: avoid;
                     font-family: 'Helvetica', sans-serif !important;
                     font-size: 13.5px;
                     line-height: 1.4;
                     font-weight: 700;
                     color: #000;
                     display: flex;
                     flex-direction: column;
                     padding: 10mm;
                  }
                  .label-h2 {
                     font-size: 18px;
                     margin: 15px 0 8px 0;
                     text-transform: capitalize;
                     font-weight: 900;
                  }
                  .columns {
                     display: grid;
                     grid-template-columns: 1fr 1fr;
                     gap: 15px;
                     width: 100%;
                  }
                  .address {
                     font-size: 12px;
                     font-weight: 700;
                  }
                  table {
                     width: 100%;
                     border-collapse: collapse;
                     margin-top: 5px;
                     border: 1.5px solid #000;
                     page-break-inside: auto;
                  }
                  tr {
                     page-break-inside: avoid;
                     page-break-after: auto;
                  }
                  thead {
                     display: table-header-group;
                  }
                  th, td {
                     padding: 8px 10px;
                     text-align: left;
                     font-weight: 700 !important;
                     border: 1.5px solid #000;
                  }
                  th {
                     font-size: 12px;
                     text-transform: capitalize;
                  }
                  hr {
                     margin: 15px 0 10px 0;
                     border: 0;
                     border-top: 1.5px solid #000;
                  }
                  .footer-note {
                     margin-top: auto;
                     padding-top: 20px;
                     padding-bottom: 20px;
                     font-size: 11px;
                     text-align: center;
                     line-height: 1.5;
                     font-weight: 900;
                  }
               }
               `}
            </style>
            <div id="printable-registry">
               {orders.filter(o => selectedIds.includes(o._id)).map((order, idx) => (
                  <div key={order._id} className={cn("label-body", idx < selectedIds.length - 1 && "print-page-break")}>
                     {/* Header Block */}
                     <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '900' }}>Order #{order._id.slice(-6).toUpperCase()}</div>
                        <div style={{ fontSize: '15.5px', fontWeight: '900' }}>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                     </div>

                     {/* Address Block */}
                     <div className="columns">
                        <div className="address">
                           <div style={{ marginBottom: '4px' }}>From</div>
                           <div>LUZZIO</div>
                           <div>Anuradhapura</div>
                           <div>NEW BUS STAND LATEST</div>
                           <div>SMART NEAR TO BOC BANK</div>
                           <div>Anuradhapura, 50000</div>
                           <div>Sri Lanka</div>
                           <div style={{ marginTop: '4px' }}>Phone: 0764800541</div>
                        </div>

                        <div className="address">
                           <div style={{ marginBottom: '4px' }}>Ship to</div>
                           <div>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                           <div>{order.shippingAddress.address}</div>
                           <div>{order.shippingAddress.city}</div>
                           <div>{order.shippingAddress.postalCode}</div>
                           <div>Sri Lanka</div>
                           <div style={{ marginTop: '4px' }}>Phone: {order.shippingAddress.phone || (order.user && order.user.phone) || order.email || ''}</div>
                        </div>
                     </div>

                     <hr />

                     <h2 className="label-h2">Order Details</h2>

                     <table>
                        <thead>
                           <tr>
                              <th style={{ width: '15%' }}>Qty</th>
                              <th style={{ width: '85%' }}>Item</th>
                           </tr>
                        </thead>
                        <tbody>
                           {order.orderItems.map((item, i) => (
                              <tr key={i}>
                                 <td>{item.qty}</td>
                                 <td>
                                    <div style={{ fontWeight: '900' }}>{item.name}</div>
                                    <div style={{ fontSize: '12.5px', marginTop: '2px' }}>fit - {item.size}</div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     {/* Footer Block */}
                     <div className="footer-note">
                        www.luzzioclothing.com<br />
                        For exchanges kindly contact our WhatsApp – 0781423168<br />
                        DM us at @luzziopremium
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminOrders;
