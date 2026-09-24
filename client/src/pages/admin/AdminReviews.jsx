// K. SRIHARAN
// Product Review & Engagement Moderation System
// Moderate, approve, respond to, and delete customer product reviews.

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, RefreshCw, Eye, CornerDownRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export default function AdminReviews() {
   const [reviews, setReviews] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState('ALL'); // ALL | APPROVED | REJECTED
   const [replyModal, setReplyModal] = useState({ open: false, review: null, text: '' });
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      fetchReviews();
   }, []);

   const fetchReviews = async () => {
      try {
         setLoading(true);
         const res = await api.get('/products/reviews/all');
         setReviews(res.data.data || []);
      } catch (err) {
         console.error('Error fetching reviews:', err);
      } finally {
         setLoading(false);
      }
   };

   const handleToggleApprove = async (review, currentStatus) => {
      try {
         await api.put(`/products/${review.productId}/reviews/${review.reviewId}/moderate`, {
            isApproved: !currentStatus
         });
         fetchReviews();
      } catch (err) {
         alert('Failed to update review moderation status');
      }
   };

   const handleDeleteReview = async (productId, reviewId) => {
      if (!window.confirm('Are you sure you want to delete this review permanently?')) return;
      try {
         await api.delete(`/products/${productId}/reviews/${reviewId}`);
         fetchReviews();
      } catch (err) {
         alert('Failed to delete review');
      }
   };

   const handleSaveReply = async (e) => {
      e.preventDefault();
      if (!replyModal.review) return;
      setSubmitting(true);
      try {
         await api.put(`/products/${replyModal.review.productId}/reviews/${replyModal.review.reviewId}/moderate`, {
            adminResponse: replyModal.text
         });
         setReplyModal({ open: false, review: null, text: '' });
         fetchReviews();
      } catch (err) {
         alert('Failed to save admin response');
      } finally {
         setSubmitting(false);
      }
   };

   const filteredReviews = reviews.filter(r => {
      if (filter === 'APPROVED') return r.isApproved === true;
      if (filter === 'REJECTED') return r.isApproved === false;
      return true;
   });

   return (
      <div className="space-y-8">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8 border-b border-black">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Customer Feedback & Engagement</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Review Moderation Center</h1>
            </div>
            <div className="flex items-center gap-4">
               <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2.5 bg-white text-black font-mono text-xs border border-white"
               >
                  <option value="ALL">All Reviews</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="REJECTED">Hidden / Rejected</option>
               </select>
               <Button onClick={fetchReviews} className="bg-brand-grey border border-white text-black">
                  <RefreshCw size={16} />
               </Button>
            </div>
         </div>

         {/* Reviews List */}
         <div className="bg-white border border-black divide-y divide-black">
            {loading ? (
               <div className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                  Loading Customer Reviews...
               </div>
            ) : filteredReviews.length === 0 ? (
               <div className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                  No Customer Reviews Found
               </div>
            ) : (
               filteredReviews.map((r) => (
                  <div key={r.reviewId} className="p-6 hover:bg-brand-grey/40 transition-colors space-y-4">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                           {r.productImage && (
                              <img src={r.productImage} alt={r.productName} className="w-12 h-12 object-cover border border-black" />
                           )}
                           <div>
                              <p className="text-xs font-black uppercase">{r.productName}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                 {[...Array(5)].map((_, i) => (
                                    <Star
                                       key={i}
                                       size={12}
                                       className={i < r.rating ? 'fill-black text-black' : 'text-gray-300'}
                                    />
                                 ))}
                                 <span className="text-[10px] font-bold ml-2">{r.rating}/5</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-1 text-[9px] font-black uppercase border ${
                              r.isApproved ? 'bg-green-100 border-green-600 text-green-800' : 'bg-red-100 border-red-600 text-red-800'
                           }`}>
                              {r.isApproved ? 'Approved' : 'Hidden'}
                           </span>
                           <Button
                              onClick={() => handleToggleApprove(r, r.isApproved)}
                              className={`text-[9px] font-black uppercase px-3 py-1.5 border ${
                                 r.isApproved ? 'bg-amber-500 text-white border-amber-600' : 'bg-black text-white border-black'
                              }`}
                           >
                              {r.isApproved ? 'Hide Review' : 'Approve Review'}
                           </Button>
                           <Button
                              onClick={() => setReplyModal({ open: true, review: r, text: r.adminResponse || '' })}
                              className="bg-brand-grey border border-black text-black text-[9px] font-black uppercase px-3 py-1.5"
                           >
                              <MessageSquare size={12} className="mr-1 inline" /> Respond
                           </Button>
                           <Button
                              onClick={() => handleDeleteReview(r.productId, r.reviewId)}
                              className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1.5"
                           >
                              <Trash2 size={12} />
                           </Button>
                        </div>
                     </div>

                     <div className="bg-gray-50 border border-gray-200 p-4 font-sans text-xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono border-b border-gray-200 pb-2">
                           <span><strong className="text-black">{r.name}</strong> ({r.email})</span>
                           <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-800 font-medium italic">"{r.comment}"</p>

                        {r.adminResponse && (
                           <div className="mt-3 pt-3 border-t border-gray-300 flex items-start gap-2 bg-brand-grey/50 p-3">
                              <CornerDownRight size={14} className="text-black shrink-0 mt-0.5" />
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-wider text-black">Luzzio Team Response</p>
                                 <p className="text-xs text-gray-700 mt-0.5">{r.adminResponse}</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Reply Modal */}
         {replyModal.open && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-lg w-full space-y-6">
                  <div className="border-b border-black pb-4">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Moderator Response</span>
                     <h3 className="text-base font-black uppercase tracking-tight mt-1">Respond to {replyModal.review?.name}</h3>
                  </div>

                  <form onSubmit={handleSaveReply} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Official Response</label>
                        <textarea
                           rows="4"
                           required
                           value={replyModal.text}
                           onChange={(e) => setReplyModal({ ...replyModal, text: e.target.value })}
                           placeholder="Type your official response to this review..."
                           className="w-full p-3 border border-black text-xs font-sans"
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submitting ? 'Saving...' : 'Publish Response'}
                        </Button>
                        <Button type="button" onClick={() => setReplyModal({ open: false, review: null, text: '' })} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
