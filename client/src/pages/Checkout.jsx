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
                                 <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg viewBox="0 0 36 12" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#1A1F71" d="M15.1,0.5l-2.1,10.7h-3.4l2.1-10.7H15.1z M24.6,0.5l-2.6,10.7h-3.3l1.7-8.3c-0.8,0-2.8,0.7-3.7,1.8l-1.3,6.5h-3.5L16,0.5h3.6c0.5,0,0.9,0.1,1.3,0.2C22.2,1,22.8,1.4,23,2c0.2,0.6,0.1,1.1,0.1,1.1S24.6,0.5,24.6,0.5z M26,0.5l1.6,10.7h3.3l-1.4-8.8c0,0,1.9-0.8,3.8,0.3c0.4,0.3,0.7,0.6,0.9,1l-0.7,7.5h3.4l0.8-8.4c-0.1-0.9-1.2-2.3-4.2-2.3c-1,0-2.3,0.3-2.9,0.7L30,0.5H26z M10.4,0.5H7.1L4.4,7.8C4.3,8.1,4.2,8.3,4.1,8.5L3.9,7.5L2.9,2.6C2.8,2,2.7,1.4,2.5,0.9C2.2,0.4,1.1,0.5,1.1,0.5L0.2,0.7L0.1,1l4,9.6l0.6,0.6h3.6L13,0.5H10.4z" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-0.5">
                                    <svg viewBox="0 0 24 16" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <circle cx="7" cy="8" r="7" fill="#EB001B" />
                                       <circle cx="17" cy="8" r="7" fill="#F79E1B" />
                                       <path d="M12 12.8995C14.7062 12.8995 16.9 10.7056 16.9 8C16.9 5.29437 14.7062 3.10052 12 3.10052C9.2938 3.10052 7.10001 5.29437 7.10001 8C7.10001 10.7056 9.2938 12.8995 12 12.8995Z" fill="#FF5F00" />
                                    </svg>
                                 </div>
                                 {/* Amex Card */}
                                 <div className="h-8 w-12 bg-[#006fcf] border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 24 16" fill="none" className="max-h-full max-w-full h-auto w-auto p-1" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M4.5 7H2.5L2 10H0L3.5 2H6.5L10 10H8L7.5 7H4.5ZM5 5L6 3L7 5H5Z" fill="white" />
                                       <path d="M12 2H15L16 6L17 2H20V10H18L18 5L16.5 10H15.5L14 5L14 10H12V2Z" fill="white" />
                                       <path d="M21 2H24V3.5H22V5H23.5V6.5H22V8.5H24V10H21V2Z" fill="white" />
                                    </svg>
                                 </div>

                                 {/* +2 Tooltip Badge */}
                                 <div className="relative group/tooltip">
                                    <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center cursor-help">
                                       <span className="text-[10px] font-bold text-gray-500">+2</span>
                                    </div>
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:flex gap-2 p-2 bg-black rounded shadow-lg z-10 w-max">
                                       <div className="absolute bottom-[-4px] right-3 w-2 h-2 bg-black rotate-45"></div>
                                       {/* Discover */}
                                       <div className="h-8 w-12 bg-white rounded overflow-hidden flex items-center justify-center p-0.5">
                                          <svg viewBox="0 0 24 16" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <path d="M2 8C2 11.3 4.7 14 8 14H16C19.3 14 22 11.3 22 8C22 4.7 19.3 2 16 2H8C4.7 2 2 4.7 2 8Z" fill="#F47B20" />
                                             <text x="12" y="10" fontSize="7" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial">DISCOVER</text>
                                          </svg>
                                       </div>
                                       {/* Diners Club */}
                                       <div className="h-8 w-12 bg-white rounded overflow-hidden flex items-center justify-center p-0.5">
                                          <svg viewBox="0 0 24 16" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                             <circle cx="8" cy="8" r="5" fill="#0079C1" />
                                             <circle cx="16" cy="8" r="5" fill="#0079C1" />
                                             <path d="M12 4.5C10.067 4.5 8.5 6.067 8.5 8C8.5 9.933 10.067 11.5 12 11.5C13.933 11.5 15.5 9.933 15.5 8C15.5 6.067 13.933 4.5 12 4.5Z" fill="white" />
                                             <text x="12" y="10.5" fontSize="3" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial">Diners Club</text>
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
                                 <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <svg viewBox="0 0 36 12" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <path fill="#1A1F71" d="M15.1,0.5l-2.1,10.7h-3.4l2.1-10.7H15.1z M24.6,0.5l-2.6,10.7h-3.3l1.7-8.3c-0.8,0-2.8,0.7-3.7,1.8l-1.3,6.5h-3.5L16,0.5h3.6c0.5,0,0.9,0.1,1.3,0.2C22.2,1,22.8,1.4,23,2c0.2,0.6,0.1,1.1,0.1,1.1S24.6,0.5,24.6,0.5z M26,0.5l1.6,10.7h3.3l-1.4-8.8c0,0,1.9-0.8,3.8,0.3c0.4,0.3,0.7,0.6,0.9,1l-0.7,7.5h3.4l0.8-8.4c-0.1-0.9-1.2-2.3-4.2-2.3c-1,0-2.3,0.3-2.9,0.7L30,0.5H26z M10.4,0.5H7.1L4.4,7.8C4.3,8.1,4.2,8.3,4.1,8.5L3.9,7.5L2.9,2.6C2.8,2,2.7,1.4,2.5,0.9C2.2,0.4,1.1,0.5,1.1,0.5L0.2,0.7L0.1,1l4,9.6l0.6,0.6h3.6L13,0.5H10.4z" />
                                    </svg>
                                 </div>
                                 {/* Mastercard Card */}
                                 <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-0.5">
                                    <svg viewBox="0 0 24 16" fill="none" className="max-h-full max-w-full h-auto w-auto" xmlns="http://www.w3.org/2000/svg">
                                       <circle cx="7" cy="8" r="7" fill="#EB001B" />
                                       <circle cx="17" cy="8" r="7" fill="#F79E1B" />
                                       <path d="M12 12.8995C14.7062 12.8995 16.9 10.7056 16.9 8C16.9 5.29437 14.7062 3.10052 12 3.10052C9.2938 3.10052 7.10001 5.29437 7.10001 8C7.10001 10.7056 9.2938 12.8995 12 12.8995Z" fill="#FF5F00" />
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
