import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Meta from '../components/ui/Meta';
import { ChevronLeft, Lock, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function Checkout() {
   const { cart, clearCart } = useCart();
   const { token, user, setGuestProfile } = useAuth();
   const navigate = useNavigate();

   const [formData, setFormData] = useState({
      email: '',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      postalCode: '',
      phone: ''
   });

   // Auto-fill user data when component mounts or user changes
   React.useEffect(() => {
      if (user) {
         const nameParts = user.name?.split(' ') || [];
         setFormData(prev => ({
            ...prev,
            email: user.email || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            address: user.shippingAddress?.address || '',
            city: user.shippingAddress?.city || '',
            postalCode: user.shippingAddress?.postalCode || '',
            phone: user.shippingAddress?.phone || ''
         }));
      }
   }, [user]);
   const [loading, setLoading] = useState(false);
   const { updateUser } = useAuth();

   const subtotal = cart.reduce((acc, item) => {
      const price = (item.product.salePrice > 0) ? item.product.salePrice : item.product.price;
      return acc + (price * item.quantity);
   }, 0);

   const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   const [paymentMethod, setPaymentMethod] = useState('PayHere');
   const [showMobileSummary, setShowMobileSummary] = useState(false);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         const orderItems = cart.map(item => ({
            name: item.product.name,
            qty: item.quantity,
            image: item.product.images[0],
            price: (item.product.salePrice > 0) ? item.product.salePrice : item.product.price,
            product: item.product._id,
            size: item.size,
            color: item.color
         }));

         // 1. Update Profile Background Sync (Non-blocking for speed)
         if (token) {
            api.put('/auth/profile', {
               shippingAddress: {
                  address: formData.address,
                  city: formData.city,
                  postalCode: formData.postalCode
               }
            }).then(profileRes => {
               if (profileRes.data.success) {
                  updateUser(profileRes.data);
               }
            }).catch(syncErr => {
               console.warn('Profile background synchronization deferred:', syncErr);
            });
         }

         // 2. Create Order
         const res = await api.post('/orders', {
            orderItems,
            email: formData.email,
            shippingAddress: {
               address: formData.address,
               city: formData.city,
               postalCode: formData.postalCode,
               firstName: formData.firstName,
               lastName: formData.lastName,
               phone: formData.phone
            },
            paymentMethod: paymentMethod,
            itemsPrice: subtotal,
            shippingPrice: 390,
            totalPrice: subtotal + 390
         });

         if (res.data.success) {
            const orderId = res.data.data._id;
            const preGeneratedParams = res.data.payhereParams;

            // 2.5 Cache email for Guest Profile access
            setGuestProfile(formData.email);


            if (paymentMethod === 'PayHere') {
               // 3. Initiate PayHere Payment (Using pre-generated params for speed)
               const startPayHere = (payment) => {
                  window.payhere.onCompleted = function onCompleted(orderId) {
                     console.log("Payment completed. OrderID:" + orderId);
                     clearCart();
                     navigate('/payment-success');
                  };

                  window.payhere.onDismissed = function onDismissed() {
                     console.log("Payment dismissed");
                     setLoading(false);
                  };

                  window.payhere.onError = function onError(error) {
                     console.log("Error:" + error);
                     setLoading(false);
                     alert("Payment failed or dismissed. Error: " + error);
                  };

                  window.payhere.startPayment(payment);
               };

               if (preGeneratedParams) {
                  startPayHere(preGeneratedParams);
               } else {
                  // Fallback for unexpected missing params
                  try {
                     const payHereRes = await api.post('/payments/payhere/initiate', { orderId });
                     if (payHereRes.data.success) {
                        startPayHere(payHereRes.data.params);
                     } else {
                        alert('Failed to initiate PayHere payment: ' + (payHereRes.data.message || 'Unknown error'));
                        setLoading(false);
                     }
                  } catch (payErr) {
                     console.error('PayHere Init Failed:', payErr);
                     alert('Failed to initiate PayHere payment');
                     setLoading(false);
                  }
               }
            } else {
               // Other methods (e.g. Stripe or Cocopay if impl)
               // For now, default to success for non-integrated
               clearCart();
               setLoading(false);
               navigate('/payment-success');
            }
         } else {
            alert('Order creation failed: ' + (res.data.message || 'Unknown error'));
            setLoading(false);
         }
      } catch (err) {
         console.error('Checkout protocol failure:', err);
         setLoading(false); // Ensure loading stops on error
      }
   };

   const PaymentMethodCard = ({ id, label, description, icon: Icon }) => (
      <div
         onClick={() => setPaymentMethod(id)}
         className={cn(
            "p-6 border-2 cursor-pointer transition-all duration-300 flex items-start gap-4",
            paymentMethod === id ? "border-black bg-brand-grey shadow-sm" : "border-gray-100 hover:border-gray-300 bg-white"
         )}
      >
         <div className={cn(
            "w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center shrink-0",
            paymentMethod === id ? "border-black bg-black" : "border-gray-300"
         )}>
            {paymentMethod === id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
         </div>
         <div className="flex-1 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{description}</p>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-gray-50/50 pt-32 pb-20">
         <Meta title="Secure Checkout" description="Complete your purchase securely at Luzzio." />

         <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="flex items-center gap-4 mb-16 md:mb-20 text-small-brand">
               <Link to="/cart" className="hover:opacity-50 flex items-center gap-2">
                  <ChevronLeft size={12} /> Return to Bag
               </Link>
               <span className="text-gray-300">/</span>
               <span className="text-black font-black">Secure Checkout</span>
            </div>

            {/* Mobile Summary Toggle */}
            <div className="lg:hidden mb-10">
               <button
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                  className="w-full p-6 bg-brand-grey border border-black flex justify-between items-center"
               >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                     {showMobileSummary ? "Hide Review" : "Show Review"} (LKR {(subtotal + 390).toLocaleString()}.00)
                  </span>
                  <ChevronLeft size={16} className={cn("transition-transform", showMobileSummary ? "rotate-90" : "-rotate-90")} />
               </button>
               {showMobileSummary && (
                  <div className="mt-4 p-6 bg-white border border-black animate-in fade-in slide-in-from-top-2">
                     <div className="space-y-6 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {cart.map((item, index) => (
                           <div key={index} className="flex gap-4 items-center">
                              <img src={item.product.images[0]} alt="" className="w-12 h-16 object-cover border border-black" />
                              <div className="flex-1 text-[9px] uppercase font-bold tracking-widest">
                                 <p className="text-black">{item.product.name} x {item.quantity}</p>
                                 <p className="text-gray-400 mt-1">{item.size} / {item.color || 'Noir'}</p>
                              </div>
                              <p className="text-[10px] font-black">LKR {(item.product.price * item.quantity).toLocaleString()}.00</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-16 md:gap-24">

               {/* LEFT: CHECKOUT SECTIONS */}
               <div className="flex-1 space-y-20 md:space-y-24">
                  <section className="space-y-8 md:space-y-10">
                     <p className="text-small-brand font-black pb-4 border-b border-black">Client Information</p>
                     <div className="grid grid-cols-1 gap-6">
                        <Input
                           name="email"
                           type="email"
                           placeholder="Email Address"
                           value={formData.email}
                           onChange={handleInputChange}
                           required
                        />
                     </div>
                  </section>

                  <section className="space-y-8 md:space-y-10">
                     <p className="text-small-brand font-black pb-4 border-b border-black">Shipping Logistics</p>
                     <div className="grid grid-cols-2 gap-6">
                        <Input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                        <Input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
                        <Input name="address" placeholder="Physical Address" className="col-span-2" value={formData.address} onChange={handleInputChange} required />
                        <Input name="city" placeholder="City" value={formData.city} onChange={handleInputChange} required />
                        <Input name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleInputChange} required />
                        <Input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required className="col-span-2" />
                     </div>
                  </section>

                  <section className="space-y-6">
                     <div className="space-y-1">
                        <p className="text-lg font-black text-black">Payment</p>
                        <p className="text-sm text-gray-500">All transactions are secure and encrypted.</p>
                     </div>

                     <div className="flex flex-col gap-4">
                        {/* PayHere Option */}
                        <div
                           onClick={() => setPaymentMethod('PayHere')}
                           className={cn(
                              "border rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                              paymentMethod === 'PayHere' ? "border-blue-600 bg-white ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300"
                           )}
                        >
                           <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center",
                                    paymentMethod === 'PayHere' ? "border-blue-600" : "border-gray-300"
                                 )}>
                                    {paymentMethod === 'PayHere' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                 </div>
                                 <span className="text-sm font-medium">Bank Card / Bank Account - PayHere</span>
                              </div>
                              <div className="flex gap-2 items-center opacity-80">
                                 {/* Visa Card */}
                                 <div className="h-9 w-auto min-w-[2.5rem] bg-white border border-gray-200 rounded flex items-center justify-center px-2 py-1">
                                    <svg viewBox="0 0 50 16" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#142787" d="M21.05 15.004h3.084l1.928-11.854h-3.085l-1.927 11.854zm17.234.313c-0.68-.25-1.748-.517-3.062-.517-3.376 0-5.753 1.79-5.772 4.354-.02 1.892 1.69 2.948 2.98 3.57 1.325.642 1.768 1.058 1.768 1.632 0 .88-1.058 1.282-2.04 1.282-1.365 0-2.093-.207-3.218-.703l-.448-.208-.477 2.973c.797.368 2.27.688 3.8.688 3.587 0 5.922-1.77 5.947-4.51.018-1.503-.896-2.65-2.864-3.59-1.194-.61-1.927-1.01-1.927-1.625 0-.563.624-1.138 1.977-1.138 1.127 0 1.944.2 2.57.472l.31.137.452-2.828zm8.794-.313H44.69c-0.74 0-1.295.215-1.618.98l-5.714 13.52h3.237l.644-1.782h3.945l.37 1.782h2.855l-1.33-14.5zm-4.965 10.003l2.036-5.825 1.166 5.825h-3.202zm-18.32-10.003L19.4 25.894l-.426-2.167c-.732-2.483-3.024-5.18-5.59-6.52l3.635 13.725h3.284l4.873-11.826h-3.385zm-12.222 0H.212l-.1.5c4.214 1.07 7 3.655 8.152 6.757l-1.186-5.688c-.247-1.032-.96-1.564-2.42-1.564z" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-9 w-auto min-w-[2.5rem] bg-white border border-gray-200 rounded flex items-center justify-center px-1">
                                    <svg viewBox="0 0 24 15" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#ff5f00" d="M12 0L12 15" stroke="none" />
                                       <circle cx="4.5" cy="7.5" r="7.5" fill="#EB001B" />
                                       <circle cx="19.5" cy="7.5" r="7.5" fill="#F79E1B" />
                                       <path fill="#FF5F00" d="M12 2.58A7.47 7.47 0 0 0 9.24 7.5a7.47 7.47 0 0 0 2.76 4.92 7.47 7.47 0 0 0 2.76-4.92A7.47 7.47 0 0 0 12 2.58z" />
                                    </svg>
                                 </div>
                                 {/* Amex Card */}
                                 <div className="h-9 w-auto min-w-[2.5rem] bg-[#006fcf] border border-gray-200 rounded flex items-center justify-center overflow-hidden px-1">
                                    <svg viewBox="0 0 40 25" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="white" d="M4.35 11.8h-1.9V8H.5v9h2.35v-3.7h1.5l1.9 3.7h2.6l-2.6-4.6 2.4-4.6H6.05l-1.7 4zm5.7-3.8h5.3v1.3h-3.4v2h3.2v1.3h-3.2v2.7h3.4V17H10V8zm9.5 0h-1.5l-2.9 8.2h-1.3l-2.9-8.2h-1.5v9h2v-4.1l1.5 4.1h1.3l1.5-4.1V17h2V8zm1.9 4.3h-1.8V8h-2.1v9h6.3v-1.6h-4.2V8h2.1l-.3 4.3zm6.6-4.3h-1.6l-2.2 3.6-2.1-3.6h-1.6l3 4.5-3.1 4.5h1.7l2.2-3.7 2.2 3.7h1.7l-3.2-4.5 3-4.5zm2.7 6.4h1.7V8h-1.7v6.4zm5.5-5.1h-2.6v2h2.5c.3 0 .4-.2.4-.4s-.1-.4-.4-.4h-1.9V8h2.5c1.4 0 2.1.6 2.1 1.6s-.8 1.6-2.6 1.6v.1c1.5 0 2.8.5 2.8 2.2 0 1.2-.7 1.9-2.2 1.9h-3.1V8h2.5zm-.1 6.5c1 0 1.3-.4 1.3-1s-.4-1.1-1.3-1.1h-2.5v2h2.5z" />
                                    </svg>
                                 </div>

                                 {/* +2 Tooltip Badge */}
                                 <div className="relative group/tooltip">
                                    <div className="h-9 w-auto min-w-[2rem] px-2 bg-white border border-gray-200 rounded flex items-center justify-center cursor-help">
                                       <span className="text-xs font-bold text-gray-500 whitespace-nowrap">+2</span>
                                    </div>
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:flex gap-2 p-2 bg-black rounded shadow-lg z-10 w-max">
                                       <div className="absolute bottom-[-4px] right-3 w-2 h-2 bg-black rotate-45"></div>
                                       {/* Discover */}
                                       <div className="h-9 w-auto bg-white rounded overflow-hidden flex items-center justify-center px-1">
                                          <svg viewBox="0 0 54 12" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <path fill="#FF6000" d="M7.74 1.48C7.14.48 6.08 0 4.28 0H.6v11.59h3.76c2 0 3.2-.5 3.86-1.57.54-.87.82-2.2.82-4.23 0-2.1-.28-3.37-.82-4.23zM2.87 9.42V2.16h.9c1.64 0 2.1 1 2.1 3.55 0 2.5-.47 3.52-2.03 3.52l-.97.19zm8.56 2.17h2.27V0h-2.27v11.59zm6.65-2.2c1.78.13 2.65-.62 2.65-2.3 0-1.42-.58-2-2.13-2.27l-1.07-.17C16.27 6.64 16 6.3 16 5.67c0-.75.48-1.2 1.48-1.2s1.43.43 1.57 1.13l2.06-.3c-.23-1.63-1.35-2.6-3.68-2.6-1.65 0-3.66.75-3.66 3.1 0 1.5.58 2.37 2.17 2.62l1 .16c1.17.2 1.34.52 1.34 1.17 0 .82-.57 1.3-1.7 1.3-1.12 0-1.72-.53-1.87-1.35l-2.18.28c.3 2.1 1.7 3.2 5.08 3.2zm6.2-4.9c0-1.9.96-3.6 2.5-4.43l1.1 1.9c-.8.43-1.3 1.3-1.25 2.53 0 1.25.5 2.12 1.3 2.55l-1.1 1.9c-1.55-.83-2.5-2.53-2.5-4.45zm8.9 0c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5zm2.75 0c0 1.24 1 2.25 2.25 2.25S40.42 7.9 40.42 6.66s-1-2.25-2.25-2.25-2.25 1-2.25 2.25zm6.8 5.4l3.15-11.59h2.15l-3.3 11.59h-2zm3.3-11.59h6v2.17h-3.73v2.33h3.5v2.17h-3.5v2.75h3.9v2.17h-6.17V0z" />
                                             <circle cx="27.89" cy="2.2" r="1" fill="#FF9900" />
                                          </svg>
                                       </div>
                                       {/* Diners Club */}
                                       <div className="h-9 w-auto bg-white rounded overflow-hidden flex items-center justify-center px-1">
                                          <svg viewBox="0 0 54 16" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <circle cx="8" cy="8" r="7" fill="#0079C1" />
                                             <circle cx="18" cy="8" r="7" fill="#0079C1" />
                                             <path d="M13 4C11 4 9 6 9 8C9 10 11 12 13 12C15 12 17 10 17 8C17 6 15 4 13 4Z" fill="white" />
                                             <text x="28" y="11" fontSize="10" fontWeight="bold" fill="#0079C1" fontFamily="Arial">Diners Club</text>
                                          </svg>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Expanded Content for PayHere */}
                           {paymentMethod === 'PayHere' && (
                              <div className="bg-gray-50 p-8 border-t border-gray-100 flex flex-col items-center text-center space-y-4">
                                 <div className="relative w-16 h-12 border-2 border-gray-400 rounded bg-white flex items-center justify-center mb-2">
                                    <div className="w-full h-2 bg-gray-100 absolute top-0 border-b border-gray-200" />
                                    <ArrowRight className="text-gray-400 ml-6" size={20} />
                                 </div>
                                 <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                                    After clicking "Pay now", you will be redirected to Bank Card / Bank Account - PayHere to complete your purchase securely.
                                 </p>
                              </div>
                           )}
                        </div>

                        {/* Koko Option */}
                        <div
                           onClick={() => setPaymentMethod('Koko')}
                           className={cn(
                              "border rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                              paymentMethod === 'Koko' ? "border-blue-600 bg-white ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300"
                           )}
                        >
                           <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center",
                                    paymentMethod === 'Koko' ? "border-blue-600" : "border-gray-300"
                                 )}>
                                    {paymentMethod === 'Koko' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                 </div>
                                 <span className="text-sm font-medium">Koko: Buy Now Pay Later</span>
                              </div>
                              <div className="flex gap-2 items-center opacity-80">
                                 {/* Visa Card */}
                                 <div className="h-9 w-auto min-w-[2.5rem] bg-white border border-gray-200 rounded flex items-center justify-center px-2 py-1">
                                    <svg viewBox="0 0 50 16" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#142787" d="M21.05 15.004h3.084l1.928-11.854h-3.085l-1.927 11.854zm17.234.313c-0.68-.25-1.748-.517-3.062-.517-3.376 0-5.753 1.79-5.772 4.354-.02 1.892 1.69 2.948 2.98 3.57 1.325.642 1.768 1.058 1.768 1.632 0 .88-1.058 1.282-2.04 1.282-1.365 0-2.093-.207-3.218-.703l-.448-.208-.477 2.973c.797.368 2.27.688 3.8.688 3.587 0 5.922-1.77 5.947-4.51.018-1.503-.896-2.65-2.864-3.59-1.194-.61-1.927-1.01-1.927-1.625 0-.563.624-1.138 1.977-1.138 1.127 0 1.944.2 2.57.472l.31.137.452-2.828zm8.794-.313H44.69c-0.74 0-1.295.215-1.618.98l-5.714 13.52h3.237l.644-1.782h3.945l.37 1.782h2.855l-1.33-14.5zm-4.965 10.003l2.036-5.825 1.166 5.825h-3.202zm-18.32-10.003L19.4 25.894l-.426-2.167c-.732-2.483-3.024-5.18-5.59-6.52l3.635 13.725h3.284l4.873-11.826h-3.385zm-12.222 0H.212l-.1.5c4.214 1.07 7 3.655 8.152 6.757l-1.186-5.688c-.247-1.032-.96-1.564-2.42-1.564z" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-9 w-auto min-w-[2.5rem] bg-white border border-gray-200 rounded flex items-center justify-center px-1">
                                    <svg viewBox="0 0 24 15" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#ff5f00" d="M12 0L12 15" stroke="none" />
                                       <circle cx="4.5" cy="7.5" r="7.5" fill="#EB001B" />
                                       <circle cx="19.5" cy="7.5" r="7.5" fill="#F79E1B" />
                                       <path fill="#FF5F00" d="M12 2.58A7.47 7.47 0 0 0 9.24 7.5a7.47 7.47 0 0 0 2.76 4.92 7.47 7.47 0 0 0 2.76-4.92A7.47 7.47 0 0 0 12 2.58z" />
                                    </svg>
                                 </div>
                              </div>
                           </div>

                           {/* Expanded Content for Koko (if needed, otherwise empty like typical radios) */}
                           {paymentMethod === 'Koko' && (
                              <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col items-center text-center">
                                 <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                                    You will be redirected to Koko to complete your payment in 3 installments.
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>
                  </section>

                  <button
                     type="submit"
                     disabled={loading || cart.length === 0}
                     className="btn-brand w-full py-6 mt-8"
                  >
                     {loading ? "Authenticating Transaction..." : `Confirm & Pay LKR ${(subtotal + 390).toLocaleString()} .00`}
                  </button>
               </div>

               {/* RIGHT: ORDER REVIEW */}
               <div className="lg:w-[450px]">
                  <div className="bg-brand-grey p-10 space-y-10 lg:sticky lg:top-24">
                     <p className="text-small-brand font-black">Archive Review</p>

                     <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 no-scrollbar">
                        {cart.map((item, index) => (
                           <div key={index} className="flex gap-6 pb-6 border-b border-black last:border-0 last:pb-0">
                              <div className="w-16 h-20 bg-white shrink-0 overflow-hidden border border-black">
                                 <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1 py-1">
                                 <p className="text-[11px] font-black uppercase tracking-tight truncate text-black">{item.product.name}</p>
                                 <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                    <p>Size: {item.size}</p>
                                    <p>Color: {item.color || 'Noir'}</p>
                                    <p>Qty: {item.quantity}</p>
                                 </div>
                                 <p className="border-t border-black pt-2 mt-2 text-[11px] font-black">
                                    LKR {((item.product.salePrice > 0 ? item.product.salePrice : item.product.price) * item.quantity).toLocaleString()}.00
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="space-y-4 pt-10 border-t border-black text-[11px] font-bold uppercase tracking-widest">
                        <div className="flex justify-between">
                           <span className="text-gray-400">Subtotal</span>
                           <span>LKR {subtotal.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-400">Shipping</span>
                           <span className="text-black">LKR 390.00</span>
                        </div>
                        <div className="border-t border-black pt-6 flex justify-between items-end">
                           <span className="text-small-brand font-black">Total Due</span>
                           <span className="text-2xl font-black tracking-tighter">LKR {(subtotal + 390).toLocaleString()}.00</span>
                        </div>
                     </div>
                  </div>
               </div>

            </form>
         </div>
      </div>
   );
}
