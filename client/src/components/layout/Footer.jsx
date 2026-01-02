import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../../services/api';

const FooterSection = ({ title, children, id, activeSection, toggleSection }) => {
   const isOpen = activeSection === id;

   return (
      <div className="border-b border-black lg:border-b-0 lg:border-r last:border-r-0 border-black transition-all duration-500">
         <button
            onClick={() => toggleSection(id)}
            className="w-full flex justify-between items-center p-8 lg:hidden text-[10px] font-black uppercase tracking-[0.3em]"
         >
            {title}
            <ChevronDown size={14} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
         </button>

         <div className={`overflow-hidden transition-all duration-500 lg:max-h-none ${isOpen ? 'max-h-[500px]' : 'max-h-0 lg:max-h-none'}`}>
            <div className="p-8 space-y-6 lg:pt-0">
               <h3 className="hidden lg:block text-[10px] font-black uppercase tracking-[0.3em] mb-6">{title}</h3>
               {children}
            </div>
         </div>
      </div>
   );
};

export function Footer() {
   const [activeSection, setActiveSection] = useState(null);
   const [email, setEmail] = useState('');
   const [newsletterStatus, setNewsletterStatus] = useState(''); // 'success', 'error', or ''
   const [isSubmitting, setIsSubmitting] = useState(false);

   const toggleSection = (id) => {
      setActiveSection(activeSection === id ? null : id);
   };

   const handleNewsletterSubmit = async (e) => {
      e.preventDefault();
      if (!email || isSubmitting) return;

      setIsSubmitting(true);
      setNewsletterStatus('');

      try {
         await api.post('/newsletter/subscribe', { email });
         setNewsletterStatus('success');
         setEmail('');
         setTimeout(() => setNewsletterStatus(''), 3000);
      } catch (err) {
         setNewsletterStatus('error');
         setTimeout(() => setNewsletterStatus(''), 3000);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <footer className="bg-brand-grey text-black border-t border-black selection:bg-black selection:text-white">
         <div className="max-w-[1920px] mx-auto">
            {/* 5-COLUMN GRID WITH VERTICAL DIVIDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-5">

               {/* COLUMN 1: CLIENT SERVICES */}
               <FooterSection
                  title="Client Services"
                  id="services"
                  activeSection={activeSection}
                  toggleSection={toggleSection}
               >
                  <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                     <li><a href="/faq" className="hover:opacity-50">FAQ</a></li>
                     <li><a href="/profile" className="hover:opacity-50">Track Order</a></li>
                     <li><a href="/return-policy" className="hover:opacity-50">Returns</a></li>
                     <li><a href="/shipping-policy" className="hover:opacity-50">Delivery</a></li>
                     <li><a href="/refund-policy" className="hover:opacity-50">Payment</a></li>
                  </ul>
               </FooterSection>

               {/* COLUMN 2: THE COMPANY */}
               <FooterSection
                  title="The Company"
                  id="company"
                  activeSection={activeSection}
                  toggleSection={toggleSection}
               >
                  <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                     <li><a href="/contact" className="hover:opacity-50">Contact</a></li>
                     <li><a href="/terms-and-conditions" className="hover:opacity-50">Legal</a></li>
                     <li><a href="/privacy-policy" className="hover:opacity-50">Privacy Policy</a></li>
                     <li><a href="/exchange-policy" className="hover:opacity-50">Exchange Policy</a></li>
                     <li><a href="/shipping-policy" className="hover:opacity-50">Shipping Policy</a></li>
                  </ul>
               </FooterSection>

               {/* COLUMN 3: FOLLOW US */}
               <FooterSection
                  title="Follow Us"
                  id="follow"
                  activeSection={activeSection}
                  toggleSection={toggleSection}
               >
                  <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
                     <li><a href="#" className="hover:opacity-50 transition-opacity">Facebook</a></li>
                     <li><a href="#" className="hover:opacity-50 transition-opacity">Instagram</a></li>
                     <li><a href="#" className="hover:opacity-50 transition-opacity">Tiktok</a></li>
                     <li><a href="#" className="hover:opacity-50 transition-opacity">Pinterest</a></li>
                  </ul>
               </FooterSection>

               {/* COLUMN 4: NEWSLETTER */}
               <FooterSection
                  title="Newsletter"
                  id="newsletter"
                  activeSection={activeSection}
                  toggleSection={toggleSection}
               >
                  <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                        Join the Luzzio Archive
                     </p>
                     <div className="relative">
                        <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="EMAIL ADDRESS"
                           required
                           disabled={isSubmitting}
                           className="w-full border border-black px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white focus:outline-none disabled:opacity-50"
                        />
                        <button
                           type="submit"
                           disabled={isSubmitting || !email}
                           className="absolute right-0 top-0 bottom-0 px-6 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black border-l border-black transition-colors disabled:opacity-50"
                        >
                           {isSubmitting ? '...' : '→'}
                        </button>
                     </div>
                  </form>
               </FooterSection>

               {/* COLUMN 5: CONTACT US */}
               <FooterSection
                  title="Contact Us"
                  id="contact"
                  activeSection={activeSection}
                  toggleSection={toggleSection}
               >
                  <div className="space-y-6 text-[10px] font-bold uppercase tracking-widest">
                     <div className="space-y-1">
                        <p className="text-black/50">Call us</p>
                        <a href="tel:+442033186032" className="underline underline-offset-4 decoration-1 hover:opacity-50 transition-opacity">+44 20 33 18 60 32</a>
                     </div>
                     <div className="space-y-1">
                        <p className="text-black/50">Support</p>
                        <a href="/contact" className="block underline underline-offset-4 decoration-1 hover:opacity-50 transition-opacity">Direct Message</a>
                     </div>
                  </div>
               </FooterSection>
            </div>

            {/* COPYRIGHT SECTION */}
            <div className="py-6 text-center border-t border-black lg:border-t-0">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">
                  © 2025 Luzzio
               </p>
            </div>
         </div>
      </footer>
   );
}
