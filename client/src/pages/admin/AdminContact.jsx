import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, X, Check, Search, Copy, ExternalLink, Download, FileSpreadsheet, Clock, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

const CANNED_TEMPLATES = [
   {
      title: '📦 Order Status & Tracking',
      text: 'Hello, thank you for reaching out to Luzzio Customer Care. Your order is currently being processed and prepared for dispatch. You will receive a live tracking update via SMS and email as soon as it leaves our central fulfillment hub.'
   },
   {
      title: '🔄 Return & Exchange Procedure',
      text: 'Hello, thank you for contacting us regarding a return or exchange. You can log an exchange request under your account dashboard, or visit our flagship store with the unworn item and invoice within 14 days of purchase.'
   },
   {
      title: '✨ Product Restocking & Sizing',
      text: 'Hello, thank you for your inquiry. This product is scheduled for incoming intake from our partner suppliers shortly. Please keep an eye on our live storefront catalog for updated variant availability.'
   },
   {
      title: '✅ Inquiry Resolved / Closure',
      text: 'Hello, thank you for contacting Luzzio. We are pleased to confirm this matter has been resolved. If you have any further questions or require additional assistance, please do not hesitate to contact our team again.'
   }
];

export default function AdminContact() {
   const { token } = useAuth();
   const [messages, setMessages] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedMessage, setSelectedMessage] = useState(null);
   const [replyText, setReplyText] = useState('');
   const [sending, setSending] = useState(false);
   const [filter, setFilter] = useState('all'); // all, pending, replied, closed
   const [searchTerm, setSearchTerm] = useState('');
   const { showToast } = useToast();
   const confirm = useConfirm();

   useEffect(() => {
      fetchMessages();
   }, []);

   const fetchMessages = async () => {
      setLoading(true);
      try {
         const res = await api.get('/contact');
         if (res.data.success) {
            setMessages(res.data.data || []);
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
            showToast('Reply sent successfully!', 'success');
         }
      } catch (error) {
         console.error('Error sending reply:', error);
         showToast('Failed to send reply.', 'error');
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
            if (selectedMessage?._id === messageId) {
               setSelectedMessage(res.data.data);
            }
            showToast(`Status updated to ${newStatus.toUpperCase()}.`, 'info');
         }
      } catch (error) {
         console.error('Error updating status:', error);
         showToast('Failed to update status.', 'error');
      }
   };

   const handleDelete = async (messageId) => {
      const yes = await confirm({
         title: 'Delete Contact Message',
         message: 'This will permanently remove this customer message and cannot be undone.',
         confirmLabel: 'Delete Message',
         danger: true
      });
      if (!yes) return;

      try {
         await api.delete(`/contact/${messageId}`);
         setMessages(messages.filter(msg => msg._id !== messageId));
         if (selectedMessage?._id === messageId) {
            setSelectedMessage(null);
         }
         showToast('Message deleted.', 'success');
      } catch (error) {
         console.error('Error deleting message:', error);
         showToast('Failed to delete message.', 'error');
      }
   };

   const handleCopyEmail = (email) => {
      if (!email) return;
      navigator.clipboard.writeText(email);
      showToast(`Copied ${email} to clipboard!`, 'success');
   };

   const applyCannedTemplate = (templateText) => {
      setReplyText(templateText);
      showToast('Template inserted into reply box.', 'info');
   };

   const exportMessagesCSV = () => {
      if (!messages || messages.length === 0) {
         showToast('No messages available to export.', 'warning');
         return;
      }
      let csv = "data:text/csv;charset=utf-8,Date,Customer Name,Email,Subject,Status,Customer Message,Admin Reply,Replied At\n";
      messages.forEach(m => {
         const date = new Date(m.createdAt).toISOString().slice(0, 10);
         const name = `"${(m.user?.name || 'Guest').replace(/"/g, '""')}"`;
         const email = `"${(m.user?.email || '').replace(/"/g, '""')}"`;
         const subject = `"${(m.subject || '').replace(/"/g, '""')}"`;
         const status = `"${m.status || ''}"`;
         const msg = `"${(m.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
         const reply = `"${(m.adminReply || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
         const repliedAt = m.repliedAt ? new Date(m.repliedAt).toISOString().slice(0, 10) : '';
         csv += `${date},${name},${email},${subject},${status},${msg},${reply},${repliedAt}\n`;
      });

      const encodedUri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Luzzio_Customer_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Contact inquiries exported successfully!', 'success');
   };

   // Filter and search
   const filteredMessages = messages.filter(msg => {
      const matchesFilter = filter === 'all' || msg.status === filter;
      if (!matchesFilter) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const name = (msg.user?.name || '').toLowerCase();
      const email = (msg.user?.email || '').toLowerCase();
      const subject = (msg.subject || '').toLowerCase();
      const body = (msg.message || '').toLowerCase();
      const reply = (msg.adminReply || '').toLowerCase();

      return name.includes(q) || email.includes(q) || subject.includes(q) || body.includes(q) || reply.includes(q);
   });

   // Metrics
   const totalCount = messages.length;
   const pendingCount = messages.filter(m => m.status === 'pending').length;
   const repliedCount = messages.filter(m => m.status === 'replied').length;
   const closedCount = messages.filter(m => m.status === 'closed').length;

   const getStatusColor = (status) => {
      switch (status) {
         case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
         case 'replied': return 'bg-green-100 text-green-800 border-green-800';
         case 'closed': return 'bg-gray-100 text-gray-800 border-gray-800';
         default: return 'bg-gray-100 text-gray-800 border-gray-800';
      }
   };

   return (
      <div className="p-8 space-y-6">
         {/* Top Header & Export */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Customer Communication Hub</span>
                  <span className="text-[8px] font-bold uppercase bg-white/20 text-white px-2 py-0.5">Sriharan</span>
               </div>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Customer Inquiries & Support</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <button
                  onClick={exportMessagesCSV}
                  className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2.5 hover:bg-gray-200 transition-all flex items-center gap-2 border border-white"
               >
                  <Download size={14} />
                  Export Inquiries (CSV)
               </button>
            </div>
         </div>

         {/* Executive KPI Summary Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-black space-y-1">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Inquiries</span>
               <p className="text-2xl font-black">{totalCount}</p>
               <p className="text-[10px] text-gray-400">All received messages</p>
            </div>
            <div className={`p-5 bg-white border border-black space-y-1 ${pendingCount > 0 ? 'border-amber-500 bg-amber-50/30' : ''}`}>
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">Needs Response</span>
                  {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
               </div>
               <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
               <p className="text-[10px] text-amber-600 font-bold">Requires support action</p>
            </div>
            <div className="p-5 bg-white border border-black space-y-1">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Replied Messages</span>
               <p className="text-2xl font-black text-emerald-700">{repliedCount}</p>
               <p className="text-[10px] text-gray-400">Addressed by staff</p>
            </div>
            <div className="p-5 bg-white border border-black space-y-1">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Resolved / Closed</span>
               <p className="text-2xl font-black text-gray-600">{closedCount}</p>
               <p className="text-[10px] text-gray-400">Completed inquiries</p>
            </div>
         </div>

         {/* Search & Filter Toolbar */}
         <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white border border-black p-4">
            <div className="relative flex-1">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input
                  type="text"
                  placeholder="Search inquiries by customer name, email, subject, or message text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-black text-xs font-mono bg-brand-grey placeholder-gray-400 focus:outline-none focus:bg-white"
               />
               {searchTerm && (
                  <button
                     onClick={() => setSearchTerm('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1"
                     title="Clear search"
                  >
                     <X size={14} />
                  </button>
               )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
               {[
                  { id: 'all', label: 'All', count: totalCount },
                  { id: 'pending', label: 'Pending', count: pendingCount },
                  { id: 'replied', label: 'Replied', count: repliedCount },
                  { id: 'closed', label: 'Closed', count: closedCount }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setFilter(tab.id)}
                     className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-wider border border-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        filter === tab.id ? 'bg-black text-white' : 'bg-white hover:bg-brand-grey text-black'
                     }`}
                  >
                     <span>{tab.label}</span>
                     <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                        filter === tab.id ? 'bg-white text-black' : 'bg-brand-grey text-gray-600'
                     }`}>
                        {tab.count}
                     </span>
                  </button>
               ))}
            </div>
         </div>

         {/* Main Content Area */}
         {loading ? (
            <div className="text-center py-20 bg-white border border-black">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading inquiries...</p>
            </div>
         ) : filteredMessages.length === 0 ? (
            <div className="border border-black bg-white p-12 text-center">
               <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
               <p className="text-xs font-black uppercase tracking-widest text-black mb-1">
                  No {filter !== 'all' ? filter : ''} messages found
               </p>
               <p className="text-[10px] text-gray-400">
                  {searchTerm ? `No messages matched "${searchTerm}"` : 'Your inbox is clear.'}
               </p>
               {searchTerm && (
                  <button
                     onClick={() => setSearchTerm('')}
                     className="mt-4 px-4 py-2 border border-black bg-black text-white text-[10px] font-black uppercase"
                  >
                     Clear Filter
                  </button>
               )}
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Messages List */}
               <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 px-1">
                     Showing {filteredMessages.length} of {messages.length} inquiries
                  </div>
                  {filteredMessages.map((msg) => (
                     <div
                        key={msg._id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`border-2 p-5 cursor-pointer transition-all ${
                           selectedMessage?._id === msg._id
                              ? 'border-black bg-brand-grey shadow-sm'
                              : 'border-gray-200 bg-white hover:border-black'
                        }`}
                     >
                        <div className="flex justify-between items-start gap-3 mb-2">
                           <div className="min-w-0 flex-1">
                              <h3 className="text-xs font-black uppercase tracking-tight truncate">
                                 {msg.subject || '(No Subject)'}
                              </h3>
                              <p className="text-[10px] text-gray-600 mt-0.5 font-sans">
                                 <span className="font-bold text-black">{msg.user?.name || 'Guest User'}</span>
                                 <span className="text-gray-400 mx-1.5">•</span>
                                 <span className="font-mono text-[9px]">{msg.user?.email}</span>
                              </p>
                           </div>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border shrink-0 ${getStatusColor(msg.status)}`}>
                              {msg.status}
                           </span>
                        </div>
                        <p className="text-[11px] font-mono leading-relaxed text-gray-700 line-clamp-2 bg-gray-50 p-2 border border-gray-100">
                           {msg.message}
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[9px] text-gray-400 font-mono">
                           <span>Received: {new Date(msg.createdAt).toLocaleString()}</span>
                           {msg.adminReply && (
                              <span className="text-emerald-700 font-black uppercase tracking-wider flex items-center gap-1">
                                 <Check size={12} /> Replied
                              </span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>

               {/* Message Detail & Reply Pane */}
               <div className="border-2 border-black p-6 bg-white sticky top-4 h-fit max-h-[calc(100vh-280px)] overflow-y-auto">
                  {selectedMessage ? (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-black pb-4">
                           <div>
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Active Inquiry</span>
                              <h2 className="text-base font-black uppercase tracking-tight">{selectedMessage.subject || 'Customer Inquiry'}</h2>
                           </div>
                           <button
                              onClick={() => setSelectedMessage(null)}
                              className="p-1.5 border border-black hover:bg-black hover:text-white transition-all"
                              title="Close detail pane"
                           >
                              <X size={16} />
                           </button>
                        </div>

                        {/* Customer Information Card */}
                        <div className="bg-brand-grey border border-black p-4 space-y-3">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Customer</p>
                                 <p className="text-xs font-black">{selectedMessage.user?.name || 'Guest'}</p>
                                 <p className="text-[10px] font-mono text-gray-600 mt-0.5">{selectedMessage.user?.email}</p>
                              </div>
                              <div className="flex gap-2">
                                 {selectedMessage.user?.email && (
                                    <>
                                       <button
                                          onClick={() => handleCopyEmail(selectedMessage.user.email)}
                                          className="text-[9px] font-black uppercase tracking-wider bg-white border border-black px-2.5 py-1 hover:bg-black hover:text-white transition-all flex items-center gap-1"
                                          title="Copy email address"
                                       >
                                          <Copy size={11} /> Copy
                                       </button>
                                       <a
                                          href={`mailto:${selectedMessage.user.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}`}
                                          className="text-[9px] font-black uppercase tracking-wider bg-white border border-black px-2.5 py-1 hover:bg-black hover:text-white transition-all flex items-center gap-1"
                                          title="Open email in native client"
                                       >
                                          <ExternalLink size={11} /> Mail
                                       </a>
                                    </>
                                 )}
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-2 border-t border-black/10">
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Inquiry Status:</span>
                              <select
                                 value={selectedMessage.status}
                                 onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                                 className="border border-black px-3 py-1 font-mono text-[10px] font-black uppercase bg-white cursor-pointer"
                              >
                                 <option value="pending">Pending</option>
                                 <option value="replied">Replied</option>
                                 <option value="closed">Closed / Resolved</option>
                              </select>
                           </div>
                        </div>

                        {/* Original Customer Message */}
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Customer Message Body</p>
                           <div className="border border-black p-4 bg-gray-50 font-mono text-xs leading-relaxed text-black">
                              {selectedMessage.message}
                           </div>
                        </div>

                        {/* Existing Admin Reply */}
                        {selectedMessage.adminReply && (
                           <div className="bg-emerald-50 border-2 border-emerald-700 p-4 space-y-1">
                              <div className="flex justify-between items-center">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                                    <Check size={13} /> Active Admin Reply
                                 </p>
                                 {selectedMessage.repliedAt && (
                                    <span className="text-[8px] font-mono text-emerald-700">
                                       {new Date(selectedMessage.repliedAt).toLocaleDateString()}
                                    </span>
                                 )}
                              </div>
                              <p className="text-xs font-mono text-emerald-900 leading-relaxed pt-1">
                                 {selectedMessage.adminReply}
                              </p>
                           </div>
                        )}

                        {/* Canned Templates & Response Form */}
                        <div className="space-y-3 pt-2 border-t border-black">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-black flex items-center gap-1.5">
                                 <Sparkles size={13} />
                                 {selectedMessage.adminReply ? 'Update Storefront Reply' : 'Compose Support Response'}
                              </p>

                              {/* Canned Templates Dropdown */}
                              <select
                                 onChange={(e) => {
                                    if (e.target.value) {
                                       applyCannedTemplate(e.target.value);
                                       e.target.value = '';
                                    }
                                 }}
                                 defaultValue=""
                                 className="text-[9px] font-black uppercase tracking-wider border border-black bg-white px-2 py-1 cursor-pointer"
                              >
                                 <option value="" disabled>-- Insert Canned Template --</option>
                                 {CANNED_TEMPLATES.map((tmpl, idx) => (
                                    <option key={idx} value={tmpl.text}>
                                       {tmpl.title}
                                    </option>
                                 ))}
                              </select>
                           </div>

                           <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your response to the customer here, or select a canned template above..."
                              rows={5}
                              className="w-full border-2 border-black p-3 text-xs font-mono resize-none focus:outline-none focus:bg-amber-50/20"
                           />

                           <button
                              onClick={() => handleReply(selectedMessage._id)}
                              disabled={sending || !replyText.trim()}
                              className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 text-xs font-black uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-all shadow-sm"
                           >
                              <Send size={14} />
                              {sending ? 'Dispatching Response...' : selectedMessage.adminReply ? 'Update Response' : 'Dispatch Response to Customer'}
                           </button>

                           <button
                              onClick={() => handleDelete(selectedMessage._id)}
                              className="w-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-widest py-2.5 transition-colors flex items-center justify-center gap-2"
                           >
                              <Trash2 size={13} />
                              Delete Customer Inquiry
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-20">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                           Select an inquiry from the ledger to inspect and reply
                        </p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
