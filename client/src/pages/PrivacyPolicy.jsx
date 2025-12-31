import React from 'react';
import Meta from '../components/ui/Meta';

export function PrivacyPolicy() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Privacy Policy | Luzzio" />

         <div className="max-w-4xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Privacy Policy
            </h1>

            <div className="space-y-12 text-[11px] font-medium leading-relaxed tracking-wide">
               <section>
                  <p className="mb-4 italic">Last Updated: December 30, 2025</p>
                  <p className="mb-4">
                     At Luzzio, we are committed to protecting your privacy and ensuring the security of your personal information.
                     This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                  </p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Information We Collect</h2>
                  <div className="space-y-4">
                     <div>
                        <p className="font-bold mb-2">Personal Information</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                           <li>Name, email address, and phone number</li>
                           <li>Billing and shipping addresses</li>
                           <li>Payment information (processed securely through our payment provider)</li>
                           <li>Order history and preferences</li>
                        </ul>
                     </div>
                     <div>
                        <p className="font-bold mb-2">Automatically Collected Information</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                           <li>IP address and browser type</li>
                           <li>Device information and operating system</li>
                           <li>Pages visited and time spent on our site</li>
                           <li>Referring website addresses</li>
                        </ul>
                     </div>
                  </div>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">How We Use Your Information</h2>
                  <p className="mb-4">We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                     <li>Process and fulfill your orders</li>
                     <li>Communicate with you about your orders and account</li>
                     <li>Send you marketing communications (with your consent)</li>
                     <li>Improve our website and customer service</li>
                     <li>Prevent fraud and enhance security</li>
                     <li>Comply with legal obligations</li>
                  </ul>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Information Sharing</h2>
                  <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                     <li>Service providers who assist in operating our business (shipping, payment processing)</li>
                     <li>Law enforcement when required by law</li>
                     <li>Business partners with your explicit consent</li>
                  </ul>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Cookies and Tracking</h2>
                  <p className="mb-4">
                     We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic,
                     and personalize content. You can control cookie preferences through your browser settings.
                  </p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Data Security</h2>
                  <p className="mb-4">
                     We implement industry-standard security measures to protect your personal information. All payment transactions
                     are encrypted using SSL technology. However, no method of transmission over the internet is 100% secure.
                  </p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Your Rights</h2>
                  <p className="mb-4">You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                     <li>Access the personal information we hold about you</li>
                     <li>Request correction of inaccurate information</li>
                     <li>Request deletion of your personal information</li>
                     <li>Opt-out of marketing communications</li>
                     <li>Object to processing of your personal information</li>
                  </ul>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Children's Privacy</h2>
                  <p className="mb-4">
                     Our website is not intended for children under 16 years of age. We do not knowingly collect personal
                     information from children under 16.
                  </p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Changes to This Policy</h2>
                  <p className="mb-4">
                     We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                     new Privacy Policy on this page and updating the "Last Updated" date.
                  </p>
               </section>

               <section>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-4">Contact Us</h2>
                  <p>
                     If you have questions about this Privacy Policy, please contact us at:<br />
                     Email: archive@luzzio.com<br />
                     Phone: +44 20 33 18 60 32
                  </p>
               </section>
            </div>
         </div>
      </div>
   );
}
