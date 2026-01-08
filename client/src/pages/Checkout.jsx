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
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg viewBox="0 0 50 16" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M19.346 0.702026L13.886 13.92H10.598L6.818 3.57003C6.634 2.87203 5.922 2.05403 4.542 1.34003C3.414 0.776026 1.626 0.518026 0.206 0.516026L0.0820007 0.758026L2.614 6.78403L5.322 13.92H8.922L13.67 0.702026H19.346ZM37.318 9.38203C37.342 5.96803 32.546 5.79403 32.582 4.19803C32.592 3.71403 33.064 3.20803 34.198 3.08803C34.774 3.02803 36.366 2.98003 37.322 3.42203L38.006 1.70003C37.078 1.37003 35.886 1.05603 34.362 1.05603C30.29 1.05603 28.122 3.16403 28.11 5.17603C28.082 8.28603 32.398 8.44203 32.418 10.082C32.426 10.372 32.32 11.232 30.984 11.332C29.694 11.428 28.188 11.058 27.246 10.63L26.55 12.302C27.534 12.766 29.358 13.162 31.258 13.178C35.534 13.178 37.662 11.112 37.318 9.38203ZM48.01 13.92H44.646L43.078 9.61003C42.446 7.15203 40.522 3.86803 38.306 3.86803H38.026L33.714 13.92H30.418L34.93 0.702026H39.266C43.206 0.702026 43.896 3.82603 43.982 4.41403C44.382 6.54003 45.486 11.082 45.486 11.082C45.892 13.204 46.546 13.654 47.01 13.782L48.01 13.92ZM24.27 0.702026H20.914L16.714 13.92H20.07L24.27 0.702026Z" fill="#1A1F70" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-0.5">
                                    <svg viewBox="0 0 24 18" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M11.6033 13.7551C10.5367 14.5414 9.21544 14.9996 7.79412 14.9996C3.93179 14.9996 0.801086 11.8689 0.801086 8.0066C0.801086 4.14429 3.93179 1.01358 7.79412 1.01358C9.21544 1.01358 10.5367 1.47171 11.6033 2.25807C12.6702 1.47171 13.9912 1.01358 15.4128 1.01358C19.2751 1.01358 22.4058 4.14429 22.4058 8.0066C22.4058 11.8689 19.2751 14.9996 15.4128 14.9996C13.9912 14.9996 12.6702 14.5414 11.6033 13.7551Z" fill="white" />
                                       <path fill="#FF5F00" d="M12.871 8.0066C12.871 5.24158 11.536 2.79373 9.47949 1.25879C7.42279 2.79373 6.08789 5.24158 6.08789 8.0066C6.08789 10.7716 7.42279 13.2195 9.47949 14.7544C11.536 13.2195 12.871 10.7716 12.871 8.0066Z" opacity="0" />
                                       <path d="M9.47949 14.7544C7.42279 13.2195 6.08789 10.7716 6.08789 8.0066C6.08789 5.24158 7.42279 2.79373 9.47949 1.25879C11.536 2.79373 12.871 5.24158 12.871 8.0066C12.871 10.7716 11.536 13.2195 9.47949 14.7544Z" fill="#FF5F00" />
                                       <path d="M7.79412 14.9996C9.21544 14.9996 10.5367 14.5414 11.6033 13.7551C12.6702 14.5414 13.9912 14.9996 15.4128 14.9996C19.2751 14.9996 22.4058 11.8689 22.4058 8.0066C22.4058 4.14429 19.2751 1.01358 15.4128 1.01358C13.9912 1.01358 12.6702 1.47171 11.6033 2.25807C10.5367 1.47171 9.21544 1.01358 7.79412 1.01358C3.93179 1.01358 0.801086 4.14429 0.801086 8.0066C0.801086 11.8689 3.93179 14.9996 7.79412 14.9996Z" fill="#FF6B00" opacity="0.1" />
                                       <circle cx="7.79412" cy="8.0066" r="6.99298" fill="#EB001B" />
                                       <circle cx="15.4128" cy="8.0066" r="6.99298" fill="#F79E1B" />
                                       <path d="M11.6033 12.678C12.6074 11.4589 13.2125 9.87329 13.2125 8.0066C13.2125 6.13991 12.6074 4.55428 11.6033 3.33516C10.5992 4.55428 9.99411 6.13991 9.99411 8.0066C9.99411 9.87329 10.5992 11.4589 11.6033 12.678Z" fill="#FF5F00" />
                                    </svg>
                                 </div>
                                 {/* Amex Card */}
                                 <div className="h-6 w-9 bg-[#006fcf] border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 24 16" fill="none" className="h-[90%] w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path transform="scale(0.045) translate(40 85)" fill="white" d="M125.7 131.7h59.1v8.601h-24.8l-10-24.6l-9.901 24.6h-24.7v-8.601h19.8l2.9-7.2h-17.7l-3.1 7.2h-21l37.2-91.8h54.1L125.7 131.7z M107.1 82.8l-8.6 21.1h17.1L107.1 82.8z M210.9 40.1h-56.9v91.7h56.9c25.3 0 45.8-20.5 45.8-45.8S236.2 40.1 210.9 40.1z M221.7 85.9 c0 5.901-4.8 10.8-10.8 10.8h-20.2V75.1h20.2C216.9 75.1 221.7 80 221.7 85.9z M308.2 87.7l16.1 44h-24.5l-9.3-24.3l-9.1 24.3 h-24.5l36.9-91.8h-46.7v-4.3h105.7v4.3h-44.6V87.7z M367.7 93.3l13.6-21.7L395 93.3H367.7z M392.6 131.7h23.5l-20-30.8l21.3-33 l-13.4-27.8h-48.5l14.4 28.9l-14.4 22.8l-2 3.1l-18.9-29.2l-13.8 22L307 40.1h-24.3l28.5 43.1L283 131.7h23.2l13.6-21.7l15.1 24.1 l19.4-31L367.7 131.7h24.9V93.3h-19.6L392.6 131.7z" />
                                    </svg>
                                 </div>

                                 {/* +2 Tooltip Badge */}
                                 <div className="relative group/tooltip">
                                    <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center cursor-help">
                                       <span className="text-[10px] font-bold text-gray-500">+2</span>
                                    </div>
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:flex gap-2 p-2 bg-black rounded shadow-lg z-10 w-max">
                                       <div className="absolute bottom-[-4px] right-3 w-2 h-2 bg-black rotate-45"></div>
                                       {/* Discover */}
                                       <div className="h-6 w-9 bg-white rounded overflow-hidden flex items-center justify-center p-0.5">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" className="h-full w-auto">
                                             <path fill="#FF6000" d="M11.9 8.1c0 2.2-1.7 4-3.8 4-2.1 0-3.8-1.8-3.8-4 0-2.2 1.7-4 3.8-4 2.1 0 3.8 1.8 3.8 4z" />
                                             <path fill="#F47321" d="M0 8.1h2.2v-5h3.6v-2H0v7zm9 0c0-1.6 1.3-2.9 2.9-2.9 1.6 0 2.9 1.3 2.9 2.9s-1.3 2.9-2.9 2.9-2.9-1.3-2.9-2.9z" opacity="0" />
                                             <path fill="#FF6000" d="M12.7 8.1c0-1.6-1.1-2.9-2.6-2.9-1.5 0-2.6 1.3-2.6 2.9s1.1 2.9 2.6 2.9c1.4.1 2.6-1.2 2.6-2.9zm10.7 0c0-2-1.2-3.6-3.1-4l-.9 3.5 1.7.5c.3.1.5.3.5.6 0 .3-.3.5-.7.5h-1.3l-.7 2.8h1.4c2 0 3.1-1.6 3.1-3.9zm-16.5 4h1.8V5.3h2.3V4.1H4.6v1.2H7v6.8zm11.7.1l.9-3.2 1.2 3.2h1.9l-2-4.9 1.8-4.2h-1.9L22 7.4l-1.3-3.3h-1.8l-1.1 2.9-.6-2.9h-1.7l1.1 4.7-1.1 3.3h1.9v.1zm-3.6-3.3c0-1.6-1.3-2.4-2.4-2.4-1.2 0-2 .8-2 2z" />
                                             <path d="M16 12.1h2.9l-.6-1.4-1-2.9-.6 1.1c-.2.4-.5.9-.7 1.3V12.1zM22.6 8.1c0-2-1.2-3.6-3.1-4l-.9 3.5 1.7.5c.3.1.5.3.5.6 0 .3-.3.5-.7.5h-1.3l-.7 2.8h1.4c2 0 3.1-1.6 3.1-3.9z" fill="#4D4D4D" />
                                          </svg>
                                       </div>
                                       {/* Diners Club */}
                                       <div className="h-6 w-9 bg-white rounded overflow-hidden flex items-center justify-center p-0.5">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" className="h-full w-auto">
                                             <path fill="#0079C1" d="M8 8c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z" />
                                             <path fill="#FFF" d="M14 11.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm-5-.6C8.4 10.4 8 9.7 8 9h1c0 .4.2.8.5 1.1l-.5.8zm-1.8-1.5H8v1h-.9c-.1-.3-.1-.7-.1-1H8v-1h-.8c0-.3.1-.7.1-1H6.3c-.2.6-.3 1.3-.3 2h1.2v-.9zm.5-2.6L7.3 7H6.1c.3-.8.8-1.5 1.6-2.2z" />
                                             <path fill="#0079C1" d="M4.6 3.9C5.5 3 6.7 2.4 8 2.2V1h-.8c-1.7.2-3.2 1-4.4 2.1l1.8.8z" />
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
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 10" className="h-full w-auto">
                                       <path fill="#1434CB" d="M12.7.2L9.4 10.5H7.3L5 2.7 4.9 2h-.1c-.1.5-.3 1.1-.6 1.8l-2.6 6.7H0L3.9.2h8.8zm8.6 0l-2.1 10.3h-2.3l2.1-10.3h2.3zm5.6 1.4c.2.6.8 2.6.8 2.6l-2.4 6.3h-2.4L20.6.2h2.5l.3 1.4c0 0 .2.7.3.9.1.3.1.3.1.3l.1-.3.3-1 .4-1.3h2.3zM25.6 4.9v.1c0 .1 0 .2-.1.3-.8 3.5-2.2 5.2-4.3 5.2-.7 0-1.3-.2-1.7-.5.5-.9 1.5-2.9 1.5-2.9.5-1.1.8-1.5 1-1.8.2-.4.7-.6 1.2-.6.7 0 1.9.1 2.4.2zM28.4.2l2.3 10.3h-2.2l-.3-1.6h-3.1l-.5 1.6H22l2.6-10.3h3.8zm-2.4 8.7h.4l1.1-5.7-.3-1.3c0-.1-.2 1.3-1.2 7z" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" className="h-full w-auto">
                                       <path fill="#FF5F00" d="M14.2 0h-4.4v18h4.4z" />
                                       <path fill="#EB001B" d="M14.2 0h-4.4v18h4.4A9 9 0 0 0 14.2 0z" />
                                       <path fill="#F79E1B" d="M9.8 18h4.4V0H9.8A9 9 0 0 1 9.8 18z" />
                                       <path fill="#FF5F00" d="M13 9a9 9 0 0 1-3.2 6.9 9 9 0 0 0 0-13.8A9 9 0 0 1 13 9z" opacity=".01" />
                                       <circle cx="7" cy="9" r="9" fill="#EB001B" />
                                       <path d="M13 9a9 9 0 0 1-3.2 6.9 9 9 0 0 0 0-13.8A9 9 0 0 1 13 9z" fill="#FF5F00" />
                                       <circle cx="17" cy="9" r="9" fill="#F79E1B" />
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
