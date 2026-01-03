import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Meta from '../components/ui/Meta';
import { Input } from '../components/ui/Input';
import { Send, MessageSquare } from 'lucide-react';
import api from '../services/api';

export function Contact() {
   const { user, token } = useAuth();
   const navigate = useNavigate();
   const [formData, setFormData] = useState({
      subject: '',
      message: ''
   });
   const [loading, setLoading] = useState(false);
   const [status, setStatus] = useState({ type: '', message: '' });
   const [myMessages, setMyMessages] = useState([]);
   const [loadingMessages, setLoadingMessages] = useState(false);

   useEffect(() => {
      if (!token) {
         navigate('/login');
      } else {
         fetchMyMessages();
      }
   }, [token, navigate]);

   const fetchMyMessages = async () => {
      setLoadingMessages(true);
      try {
         const res = await api.get('/contact/my-messages');
         if (res.data.success) {
            setMyMessages(res.data.data);
         }
      } catch (error) {
         console.error('Error fetching messages:', error);
      } finally {
         setLoadingMessages(false);
      }
   };

   const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setStatus({ type: '', message: '' });

      try {
         const res = await api.post('/contact', formData);

         if (res.data.success) {
            setStatus({ type: 'success', message: 'Message sent successfully! We\'ll get back to you soon.' });
            setFormData({ subject: '', message: '' });
            fetchMyMessages(); // Refresh messages
         }
      } catch (error) {
         setStatus({
            type: 'error',
            message: error.response?.data?.message || 'Failed to send message. Please try again.'
         });
      } finally {
         setLoading(false);
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'pending': return 'text-yellow-700';
         case 'replied': return 'text-green-700';
         case 'closed': return 'text-gray-500';
         default: return 'text-gray-700';
      }
   };

   return (
      <div className="min-h-screen bg-white pt-24 pb-40 px-10">
         <Meta title="Contact Us | Luzzio" />

         <div className="max-w-6xl mx-auto">
            <h1 className="text-[32px] font-black uppercase tracking-tight mb-12 border-b-2 border-black pb-6">
               Contact Us
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               {/* Contact Form */}
               <div>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6">Send Us a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                     <Input
                        name="subject"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        maxLength={200}
                     />

                     <div>
                        <textarea
                           name="message"
                           placeholder="Your Message"
                           value={formData.message}
                           onChange={handleInputChange}
                           required
                           maxLength={2000}
                           rows={8}
                           className="w-full border border-black px-4 py-3 text-[11px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                        <p className="text-[9px] text-gray-500 mt-2 tracking-widest">
                           {formData.message.length}/2000 characters
                        </p>
                     </div>

                     {status.message && (
                        <div className={`p-4 border ${status.type === 'success' ? 'border-green-700 bg-green-50' : 'border-red-700 bg-red-50'}`}>
                           <p className={`text-[10px] font-bold tracking-widest ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                              {status.message}
                           </p>
                        </div>
                     )}

                     <button
                        type="submit"
                        disabled={loading}
                        className="btn-brand w-full py-4 flex items-center justify-center gap-3"
                     >
                        <Send size={14} />
                        {loading ? 'Sending...' : 'Send Message'}
                     </button>
                  </form>

                  {/* Contact Info */}
                  <div className="mt-12 space-y-6 text-[11px] font-medium leading-relaxed tracking-wide">
                     <div>
                        <p className="font-black uppercase tracking-widest mb-2">Email</p>
                        <a href="mailto:archive@luzzio.com" className="underline underline-offset-4">
                           archive@luzzio.com
                        </a>
                     </div>
                     <div>
                        <p className="font-black uppercase tracking-widest mb-2">Phone</p>
                        <a href="tel:+442033186032" className="underline underline-offset-4">
                           +44 20 33 18 60 32
                        </a>
                     </div>
                     <div>
                        <p className="font-black uppercase tracking-widest mb-2">Hours</p>
                        <p>Monday - Friday: 9 AM - 6 PM GMT</p>
                     </div>
                  </div>
               </div>

               {/* My Messages */}
               <div>
                  <h2 className="text-[14px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                     <MessageSquare size={16} />
                     My Messages
                  </h2>

                  {loadingMessages ? (
                     <div className="text-center py-12">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading messages...</p>
                     </div>
                  ) : myMessages.length === 0 ? (
                     <div className="border border-black p-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                           No messages yet. Send us a message to get started!
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                        {myMessages.map((msg) => (
                           <div key={msg._id} className="border border-black p-6 space-y-3">
                              <div className="flex justify-between items-start">
                                 <h3 className="text-[11px] font-black uppercase tracking-tight">{msg.subject}</h3>
                                 <span className={`text-[9px] font-bold uppercase tracking-widest ${getStatusColor(msg.status)}`}>
                                    {msg.status}
                                 </span>
                              </div>

                              <p className="text-[10px] font-medium leading-relaxed text-gray-700">
                                 {msg.message}
                              </p>

                              {msg.adminReply && (
                                 <div className="bg-brand-grey border-l-4 border-black p-4 mt-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-2">Admin Reply:</p>
                                    <p className="text-[10px] font-medium leading-relaxed">
                                       {msg.adminReply}
                                    </p>
                                    <p className="text-[8px] text-gray-500 mt-2 uppercase tracking-widest">
                                       Replied on {new Date(msg.repliedAt).toLocaleDateString()}
                                    </p>
                                 </div>
                              )}

                              <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                                 Sent on {new Date(msg.createdAt).toLocaleDateString()}
                              </p>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
