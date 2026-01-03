import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import Meta from '../components/ui/Meta';
import { ChevronLeft, Lock } from 'lucide-react';

export default function ResetPassword() {
   const [code, setCode] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
         return setError('Password verification failed. Inputs do not match.');
      }

      setLoading(true);
      setError('');

      try {
         const res = await api.put(`/auth/resetpassword/${code}`, { password });
         if (res.data.success) {
            navigate('/login', { state: { message: 'Password reset successful. Protocol updated.' } });
         }
      } catch (err) {
         setError(err.response?.data?.message || 'Invalid or expired verification code.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-white pt-32 pb-40 px-10 flex justify-center">
         <Meta title="Password Reset | Luzzio" />

         <div className="w-full max-w-md space-y-12">
            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-small-brand hover:opacity-50 transition-all">
               <ChevronLeft size={12} /> Back to Recovery
            </Link>

            <div className="space-y-4">
               <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                  Reset Protocol
               </h1>
               <p className="text-small-brand text-gray-400">
                  Enter your verification code and define a new access key.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="space-y-6">
                  <Input
                     label="Security Code"
                     placeholder="6-Digit Verification Code"
                     value={code}
                     onChange={(e) => setCode(e.target.value)}
                     required
                  />
                  <Input
                     label="New Private Key"
                     type="password"
                     placeholder="New Password (min 6 characters)"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                  />
                  <Input
                     label="Verify Key"
                     type="password"
                     placeholder="Confirm New Password"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     required
                  />
               </div>

               {error && <p className="text-[10px] font-black tracking-widest text-red-500">{error}</p>}

               <div className="p-6 border border-black bg-brand-grey space-y-4">
                  <div className="flex items-center gap-3 text-black">
                     <Lock size={16} />
                     <p className="text-small-brand font-black">Cryptographic Standard</p>
                  </div>
                  <p className="text-[10px] font-medium leading-relaxed text-gray-500 tracking-widest">
                     Your new password will be encrypted using industry-standard protocols.
                  </p>
               </div>

               <Button
                  type="submit"
                  className="w-full py-6"
                  disabled={loading}
               >
                  {loading ? 'Updating Protocol...' : 'Finalize Reset'}
               </Button>
            </form>
         </div>
      </div>
   );
}
