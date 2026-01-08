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
                                    <svg viewBox="0 0 36 12" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M13.6 0.1L9.8 10.3H7.5L4.8 2.2C4.7 1.8 4.2 0.7 2.4 0.7H0.1V0.9C0.1 0.9 4.1 1.0 8.8 10.3H11.9L16.2 0.1H13.6ZM22.2 0.2C21.2 0.2 20.8 0.7 20.3 1.5C20.3 1.5 18.6 9.4 18.6 9.4C18.6 9.4 18.1 10.3 19.3 10.3H21.7C21.7 10.3 22.1 8.2 22.1 8.2C22.6 8.2 25.1 8.2 25.6 8.2C25.7 9.0 25.9 10.3 25.9 10.3H28.6C28.6 10.3 27.2 3.6 26.9 2.1C26.5 0.7 25.3 0.2 24.1 0.2H22.2ZM22.7 2.8L24.8 6.5H22.4C22.5 5.8 22.7 2.8 22.7 2.8ZM33.7 4.9C33.8 3.3 32.4 2.6 31.4 2.1C30.9 1.9 30.1 1.7 30.1 1.4C30.1 1.0 30.5 0.9 31.2 0.9C31.5 0.9 32.6 1.0 33.7 1.5L34.1 0.5C33.7 0.3 32.1 0.1 31.3 0.1C29.2 0.1 27.7 1.2 27.7 2.6C27.7 4.3 30.1 4.7 31.1 5.2C31.7 5.5 31.9 5.8 31.9 6.2C31.9 6.7 31.1 7.0 30.2 7.0C29.6 7.0 27.8 6.9 26.6 6.3L26.1 7.4C27.1 7.8 29.0 7.9 30.2 7.9C32.5 7.9 34.0 6.8 33.9 4.9Z" fill="#1434CB" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg viewBox="0 0 32 20" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <circle cx="10" cy="10" r="10" fill="#EB001B" />
                                       <circle cx="22" cy="10" r="10" fill="#F79E1B" />
                                       <path d="M16 3.6C14.7 5.4 14 7.6 14 10C14 12.4 14.7 14.6 16 16.4C17.3 14.6 18 12.4 18 10C18 7.6 17.3 5.3 16 3.6Z" fill="#FF5F00" />
                                    </svg>
                                 </div>
                                 {/* Amex Card */}
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 30 20" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M0 3C0 1.34315 1.34315 0 3 0H27C28.6569 0 30 1.34315 30 3V17C30 18.6569 28.6569 20 27 20H3C1.34315 20 0 18.6569 0 17V3Z" fill="#006fcf" />
                                       <path d="M11 7.5H4V12.5H6.5V11.5H8.5V12.5H11V7.5ZM6 8.5H8v2H6V8.5ZM13.5 12.5H16V12H13.5V11H15V10H13.5V9H15.5V8H12.5V12.5H13.5ZM17.5 12.5H18.5V10.5H20v2H21V7.5H20V9.5H18.5V7.5H17.5V12.5ZM22.5 10.5H23.5L24 11.5H24.5L25 10.5H26L24.5 7.5h-1L22.5 10.5Z" fill="white" />
                                       <path d="M6 10H8V9H6M24 8.5L23.5 10h1L24 8.5Z" fill="white" />
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
                                          <svg viewBox="0 0 30 18" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <path d="M1.5 5.5H5.5C6.5 5.5 7.5 6.5 7.5 7.5V11.5C7.5 12.5 6.5 13.5 5.5 13.5H1.5V5.5Z" fill="#FF6000" />
                                             <path d="M1.5 5.5V13.5M8.5 5.5H10.5V13.5H8.5V5.5ZM12 5.5H15.5C14.5 5.5 14 6.5 14 7.5C14 8 14.5 8.5 15 8.5C15.5 8.5 16 9 16 9.5C16 10.5 15 11 14 11H12V5.5ZM17.5 5.5H20.5C19.5 5.5 19 6.5 19 7.5V11.5C19 12.5 19.5 13.5 20.5 13.5H17.5V5.5ZM22 5.5H24V13.5H22V5.5ZM25.5 5.5H28.5V13.5H25.5V5.5ZM27 5.5H29V7H27V5.5ZM27 8H29V13.5H27V8Z" fill="#4D4D4D" /> {/* Simplified Discover Text representation */}
                                             <rect width="30" height="18" fill="#FF6000" fillOpacity="0.1" />
                                             <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000" fontFamily="sans-serif">DISCOVER</text>
                                          </svg>
                                       </div>
                                       {/* Diners Club / Other */}
                                       <div className="h-6 w-9 bg-white rounded overflow-hidden flex items-center justify-center p-0.5">
                                          <svg viewBox="0 0 30 18" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <circle cx="10" cy="9" r="6" fill="#004A97" />
                                             <circle cx="20" cy="9" r="6" fill="#004A97" />
                                             <path d="M15 9C13 9 11.5 7.5 11.5 5.5C11.5 7.5 13 9 15 9Z" fill="white" />
                                             <path d="M15 9C17 9 18.5 10.5 18.5 12.5C18.5 10.5 17 9 15 9Z" fill="white" />
                                             <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#004A97" fontFamily="sans-serif">Diners</text>
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
                                    <svg viewBox="0 0 36 12" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M13.6 0.1L9.8 10.3H7.5L4.8 2.2C4.7 1.8 4.2 0.7 2.4 0.7H0.1V0.9C0.1 0.9 4.1 1.0 8.8 10.3H11.9L16.2 0.1H13.6ZM22.2 0.2C21.2 0.2 20.8 0.7 20.3 1.5C20.3 1.5 18.6 9.4 18.6 9.4C18.6 9.4 18.1 10.3 19.3 10.3H21.7C21.7 10.3 22.1 8.2 22.1 8.2C22.6 8.2 25.1 8.2 25.6 8.2C25.7 9.0 25.9 10.3 25.9 10.3H28.6C28.6 10.3 27.2 3.6 26.9 2.1C26.5 0.7 25.3 0.2 24.1 0.2H22.2ZM22.7 2.8L24.8 6.5H22.4C22.5 5.8 22.7 2.8 22.7 2.8ZM33.7 4.9C33.8 3.3 32.4 2.6 31.4 2.1C30.9 1.9 30.1 1.7 30.1 1.4C30.1 1.0 30.5 0.9 31.2 0.9C31.5 0.9 32.6 1.0 33.7 1.5L34.1 0.5C33.7 0.3 32.1 0.1 31.3 0.1C29.2 0.1 27.7 1.2 27.7 2.6C27.7 4.3 30.1 4.7 31.1 5.2C31.7 5.5 31.9 5.8 31.9 6.2C31.9 6.7 31.1 7.0 30.2 7.0C29.6 7.0 27.8 6.9 26.6 6.3L26.1 7.4C27.1 7.8 29.0 7.9 30.2 7.9C32.5 7.9 34.0 6.8 33.9 4.9Z" fill="#1434CB" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-6 w-9 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg viewBox="0 0 32 20" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <circle cx="10" cy="10" r="10" fill="#EB001B" />
                                       <circle cx="22" cy="10" r="10" fill="#F79E1B" />
                                       <path d="M16 3.6C14.7 5.4 14 7.6 14 10C14 12.4 14.7 14.6 16 16.4C17.3 14.6 18 12.4 18 10C18 7.6 17.3 5.3 16 3.6Z" fill="#FF5F00" />
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
