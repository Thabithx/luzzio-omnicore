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

         {/* PRINTABLE AREA - SHOPIFY STYLE */}
         <div className="hidden print:block print:m-0 print:p-0">
            <style>
               {`
               @media print {
                  * {
                     print-color-adjust: exact;
                     -webkit-print-color-adjust: exact;
                  }
                  @page {
                     size: A4;
                     margin: 0; /* Control margin via padding to avoid browser inconsistencies */
                  }
                  html, body {
                     margin: 0 !important;
                     padding: 0 !important;
                     width: 100% !important;
                     height: auto !important; /* Changed to auto to stop blank pages */
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
                     position: relative !important; /* Relative is more stable for page flow */
                     left: 0 !important;
                     top: 0 !important;
                     width: 100% !important;
                     margin: 0 !important;
                     /* Significant padding for balanced positioning (Top, Right, Bottom, Left) */
                     padding: 4cm 2cm 2cm 4cm !important; 
                     background: white !important;
                     color: #000;
                     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                     box-sizing: border-box !important;
                  }
                  .print-page-break {
                     page-break-after: always !important;
                     break-after: page !important;
                  }
                  .label-body {
                     width: 100%;
                     /* Only break via the explicit print-page-break class */
                     padding-bottom: 2rem;
                     position: relative;
                     box-sizing: border-box;
                     text-align: left;
                  }
                  .label-body:last-child {
                     padding-bottom: 0;
                     page-break-after: avoid !important;
                     break-after: avoid !important;
                  }
                  
                  /* HEADER */
                  .print-header {
                     width: 100%;
                     display: flex;
                     justify-content: flex-start;
                     margin-bottom: 30px;
                     align-items: flex-start;
                  }
                  .order-meta {
                     text-align: left;
                  }
                  .print-order-id {
                     font-size: 16pt;
                     font-weight: 700;
                     margin-bottom: 5px;
                     color: #000;
                     line-height: 1;
                  }
                  .print-date {
                     font-size: 11pt;
                     font-weight: 500;
                     color: #000;
                  }

                  /* ADDRESS COLUMNS */
                  .columns {
                     display: flex;
                     width: 100%;
                     margin-bottom: 30px;
                     border-bottom: 1px solid #ccc;
                     padding-bottom: 30px;
                  }
                  .address-column {
                     width: 50%;
                     padding-right: 20px;
                  }
                  .address-column h3 {
                     font-size: 10pt;
                     font-weight: 700;
                     text-transform: capitalize;
                     color: #000;
                     margin: 0 0 10px 0;
                  }
                  .address-lines {
                     font-size: 10pt;
                     line-height: 1.4;
                     color: #000;
                  }
                  .store-name {
                     font-weight: 900;
                     text-transform: uppercase;
                  }

                  /* ORDER TABLE */
                  .label-h2 {
                     font-size: 11pt;
                     font-weight: 700;
                     text-transform: capitalize;
                     margin: 0 0 15px 0;
                     color: #000;
                  }
                  table {
                     width: 100%;
                     border-collapse: collapse;
                     margin-bottom: 30px;
                     border: 1px solid #ccc;
                  }
                  th {
                     text-align: left;
                     font-size: 9pt;
                     font-weight: 600;
                     color: #000;
                     border-bottom: 1px solid #ccc;
                     padding: 10px 12px;
                     background: #fafafa;
                  }
                  td {
                     padding: 12px;
                     border-bottom: 1px solid #eee;
                     vertical-align: top;
                     font-size: 10pt;
                     color: #000;
                  }
                  .qty-col { width: 10%; vertical-align: top; }
                  .item-col { width: 90%; }
                  
                  /* FOOTER */
                  .footer-note {
                     text-align: center;
                     font-size: 8pt;
                     color: #000;
                     margin-top: 50px;
                     line-height: 1.5;
                  }
               }
               `}
            </style>
            <div id="printable-registry">
               {orders.filter(o => selectedIds.includes(o._id)).map((order, idx) => (
                  <div key={order._id} className={cn("label-body", idx < selectedIds.length - 1 && "print-page-break")}>
                     {/* Header: Only Order ID and Date on Right */}
                     <div className="print-header">
                        <div className="order-meta">
                           <div className="print-order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
                           <div className="print-date">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                           </div>
                        </div>
                     </div>

                     {/* Addresses: From (Left) - Ship To (Right) */}
                     <div className="columns">
                        <div className="address-column">
                           <h3>From</h3>
                           <div className="address-lines">
                              <div className="store-name">LUZZIO</div>
                              Anuradhapura<br />
                              NEW BUS STAND LATEST<br />
                              SMART NEAR TO BOC BANK<br />
                              Anuradhapura, 50000<br />
                              Sri Lanka<br />
                              Phone: 0764800541
                           </div>
                        </div>
                        <div className="address-column">
                           <h3>Ship to</h3>
                           <div className="address-lines">
                              <div className="store-name">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.city}<br />
                              {order.shippingAddress.postalCode}<br />
                              {order.shippingAddress.country || 'Sri Lanka'}<br />
                              {order.shippingAddress.phone && `Phone: ${order.shippingAddress.phone}`}
                              {!order.shippingAddress.phone && (
                                 (order.user && order.user.phone) ? `Phone: ${order.user.phone}` : `Email: ${order.email}`
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Order Details */}
                     <h2 className="label-h2">Order Details</h2>
                     <table>
                        <thead>
                           <tr>
                              <th className="qty-col">Qty</th>
                              <th className="item-col">Item</th>
                           </tr>
                        </thead>
                        <tbody>
                           {order.orderItems.map((item, i) => (
                              <tr key={i}>
                                 <td className="qty-col">{item.qty}</td>
                                 <td className="item-col">
                                    <div style={{ fontWeight: '600' }}>{item.name} {item.size && `- ${item.size}`}</div>
                                    <div style={{ fontSize: '9pt', marginTop: '2px', color: '#555' }}>
                                       {/* Optional: Add SKU if available */}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     {/* Footer */}
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
