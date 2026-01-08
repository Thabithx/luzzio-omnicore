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
                                 {/* Amex Card */}
                                 <div className="h-6 w-9 bg-[#006fcf] border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 40 40" fill="none" className="h-full w-auto scale-[1.8]" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M26.26 18.067H22.957L21.737 21H18.665L23.498 10H25.684L30.551 21H27.502L26.26 18.067ZM23.774 15.908H25.46L24.604 13.56L23.774 15.908ZM6.812 10H1L5.906 21H8.761L12.35 12.915L15.94 21H18.795L23.701 10H17.889L15.538 10.021L12.35 17.202L9.162 10.021L6.812 10ZM35.306 18.784C35.797 18.784 36.568 18.57 36.568 17.585C36.568 16.599 35.797 16.386 35.306 16.386H33.007V18.784H35.306ZM35.156 14.156C35.563 14.156 36.205 13.985 36.205 13.15C36.205 12.316 35.563 12.145 35.156 12.145H33.007V14.156H35.156ZM30.075 21H32.493L33.799 18.72L35.253 21H38.036L35.854 17.778C37.481 17.479 38.659 16.664 38.659 14.991C38.659 14.198 38.359 13.599 37.824 13.171C38.701 12.786 39.194 11.972 39.194 11.051C39.194 9.38797 37.845 9.07497 36.36 9.07497L29.987 8.99597L30.075 21Z" fill="white" />
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
