import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import Meta from '../components/ui/Meta';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
   const [email, setEmail] = useState('');
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState('');
   const [error, setError] = useState('');

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setMessage('');

      try {
         const res = await api.post('/auth/forgotpassword', { email });
         if (res.data.success) {
            setMessage('A security code has been generated. Please check the system logs or contact administration.');
         }
      } catch (err) {
         setError(err.response?.data?.message || 'Failed to initiate reset protocol.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-white pt-32 pb-40 px-10 flex justify-center">
         <Meta title="Password Recovery | Luzzio" />

         <div className="w-full max-w-md space-y-12">
            <Link to="/login" className="inline-flex items-center gap-2 text-small-brand hover:opacity-50 transition-all">
               <ChevronLeft size={12} /> Return to Login
            </Link>

            <div className="space-y-4">
               <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                  Credential Recovery
               </h1>
               <p className="text-small-brand text-gray-400">
                  Initiate the security protocol to regain access to your archive.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="space-y-6">
                  <Input
                     label="Verified Email"
                     type="email"
                     placeholder="Enter your registered email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                  />
               </div>

               {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>}
               {message && (
                  <div className="p-6 border border-black bg-brand-grey space-y-4">
                     <div className="flex items-center gap-3 text-black">
                        <ShieldCheck size={16} />
                        <p className="text-small-brand font-black">Protocol Initiated</p>
                     </div>
                     <p className="text-[10px] uppercase font-medium leading-relaxed text-gray-500 tracking-widest">
                        {message}
                     </p>
                     <Link
                        to="/reset-password"
                        className="block text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
                     >
                        Proceed to Reset Screen
                     </Link>
                  </div>
               )}

               <Button
                  type="submit"
                  className="w-full py-6"
                  disabled={loading}
               >
                  {loading ? 'Authenticating...' : 'Generate Reset Code'}
               </Button>
            </form>
         </div>
      </div>
   );
}
