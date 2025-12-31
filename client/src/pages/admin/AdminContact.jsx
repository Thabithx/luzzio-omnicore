import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, X, Check } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminContact() {
   const { token } = useAuth();
   const [messages, setMessages] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedMessage, setSelectedMessage] = useState(null);
   const [replyText, setReplyText] = useState('');
   const [sending, setSending] = useState(false);
   const [filter, setFilter] = useState('all'); // all, pending, replied, closed

   useEffect(() => {
      fetchMessages();
   }, []);

   const fetchMessages = async () => {
      setLoading(true);
      try {
         const res = await api.get('/contact');
         if (res.data.success) {
            setMessages(res.data.data);
         }
      } catch (error) {
         console.error('Error fetching messages:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleReply = async (messageId) => {
      if (!replyText.trim()) return;

      setSending(true);
      try {
         const res = await api.put(`/contact/${messageId}/reply`, { adminReply: replyText });
         if (res.data.success) {
            setMessages(messages.map(msg =>
               msg._id === messageId ? res.data.data : msg
            ));
            setReplyText('');
            setSelectedMessage(null);
            alert('Reply sent successfully!');
         }
      } catch (error) {
         console.error('Error sending reply:', error);
         alert('Failed to send reply');
      } finally {
         setSending(false);
      }
   };

   const handleUpdateStatus = async (messageId, newStatus) => {
      try {
         const res = await api.put(`/contact/${messageId}/status`, { status: newStatus });
         if (res.data.success) {
            setMessages(messages.map(msg =>
               msg._id === messageId ? res.data.data : msg
            ));
         }
      } catch (error) {
         console.error('Error updating status:', error);
         alert('Failed to update status');
      }
   };

   const handleDelete = async (messageId) => {
      if (!confirm('Are you sure you want to delete this message?')) return;

      try {
         await api.delete(`/contact/${messageId}`);
         setMessages(messages.filter(msg => msg._id !== messageId));
         if (selectedMessage?._id === messageId) {
            setSelectedMessage(null);
         }
      } catch (error) {
         console.error('Error deleting message:', error);
         alert('Failed to delete message');
      }
   };

   const filteredMessages = messages.filter(msg => {
      if (filter === 'all') return true;
      return msg.status === filter;
   });

   const getStatusColor = (status) => {
      switch (status) {
         case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
         case 'replied': return 'bg-green-100 text-green-800 border-green-800';
         case 'closed': return 'bg-gray-100 text-gray-800 border-gray-800';
         default: return 'bg-gray-100 text-gray-800 border-gray-800';
      }
   };

   return (
      <div className="p-8">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight">Contact Messages</h1>
            <div className="flex gap-2">
               {['all', 'pending', 'replied', 'closed'].map(status => (
                  <button
                     key={status}
                     onClick={() => setFilter(status)}
                     className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-black transition-colors ${filter === status ? 'bg-black text-white' : 'bg-white hover:bg-brand-grey'
                        }`}
                  >
                     {status}
                  </button>
               ))}
            </div>
         </div>

         {loading ? (
            <div className="text-center py-20">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading messages...</p>
            </div>
         ) : filteredMessages.length === 0 ? (
            <div className="border border-black p-12 text-center">
               <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  No {filter !== 'all' ? filter : ''} messages found
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Messages List */}
               <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
                  {filteredMessages.map((msg) => (
                     <div
                        key={msg._id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`border-2 p-6 cursor-pointer transition-all ${selectedMessage?._id === msg._id
                           ? 'border-black bg-brand-grey'
                           : 'border-gray-300 hover:border-black'
                           }`}
                     >
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <h3 className="text-[11px] font-black uppercase tracking-tight mb-1">
                                 {msg.subject}
                              </h3>
                              <p className="text-[9px] font-medium text-gray-600">
                                 From: {msg.user?.name} ({msg.user?.email})
                              </p>
                           </div>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border ${getStatusColor(msg.status)}`}>
                              {msg.status}
                           </span>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed text-gray-700 line-clamp-2">
                           {msg.message}
                        </p>
                        <p className="text-[8px] text-gray-500 mt-2 uppercase tracking-widest">
                           {new Date(msg.createdAt).toLocaleString()}
                        </p>
                     </div>
                  ))}
               </div>

               {/* Message Detail & Reply */}
               <div className="border border-black p-6 sticky top-0">
                  {selectedMessage ? (
                     <div className="space-y-6">
                        <div className="flex justify-between items-start">
                           <h2 className="text-[14px] font-black uppercase tracking-widest">Message Details</h2>
                           <button
                              onClick={() => setSelectedMessage(null)}
                              className="p-1 hover:opacity-50"
                           >
                              <X size={20} />
                           </button>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Subject</p>
                              <p className="text-[11px] font-black uppercase tracking-tight">{selectedMessage.subject}</p>
                           </div>

                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">From</p>
                              <p className="text-[10px] font-medium">{selectedMessage.user?.name}</p>
                              <p className="text-[9px] text-gray-600">{selectedMessage.user?.email}</p>
                           </div>

                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Message</p>
                              <p className="text-[10px] font-medium leading-relaxed">{selectedMessage.message}</p>
                           </div>

                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
                              <select
                                 value={selectedMessage.status}
                                 onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                                 className="border border-black px-4 py-2 text-[10px] font-medium uppercase tracking-widest"
                              >
                                 <option value="pending">Pending</option>
                                 <option value="replied">Replied</option>
                                 <option value="closed">Closed</option>
                              </select>
                           </div>

                           {selectedMessage.adminReply && (
                              <div className="bg-brand-grey border-l-4 border-black p-4">
                                 <p className="text-[9px] font-black uppercase tracking-widest mb-2">Your Reply</p>
                                 <p className="text-[10px] font-medium leading-relaxed mb-2">
                                    {selectedMessage.adminReply}
                                 </p>
                                 <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                                    Replied on {new Date(selectedMessage.repliedAt).toLocaleDateString()}
                                 </p>
                              </div>
                           )}

                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                 {selectedMessage.adminReply ? 'Update Reply' : 'Send Reply'}
                              </p>
                              <textarea
                                 value={replyText}
                                 onChange={(e) => setReplyText(e.target.value)}
                                 placeholder="Type your reply here..."
                                 rows={6}
                                 className="w-full border border-black px-4 py-3 text-[11px] font-medium tracking-wide resize-none"
                              />
                              <button
                                 onClick={() => handleReply(selectedMessage._id)}
                                 disabled={sending || !replyText.trim()}
                                 className="btn-brand w-full mt-3 py-3 flex items-center justify-center gap-2"
                              >
                                 <Send size={14} />
                                 {sending ? 'Sending...' : 'Send Reply'}
                              </button>
                           </div>

                           <button
                              onClick={() => handleDelete(selectedMessage._id)}
                              className="w-full border border-red-600 text-red-600 px-6 py-3 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                           >
                              <Trash2 size={14} />
                              Delete Message
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-20">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                           Select a message to view details
                        </p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
