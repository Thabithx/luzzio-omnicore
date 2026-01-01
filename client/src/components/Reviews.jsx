import React, { useState } from 'react';
import { Star, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import api from '../services/api';

export function Reviews({ productId, reviews = [], onReviewAdded }) {
   const [formData, setFormData] = useState({
      rating: 5,
      comment: '',
      images: [],
      name: '',
      email: ''
   });
   const [uploading, setUploading] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState(false);
   const [hoverRating, setHoverRating] = useState(0);

   const handleUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const uploadData = new FormData();
      files.forEach(file => {
         uploadData.append('images', file);
      });

      try {
         setUploading(true);
         const res = await api.post('/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });
         setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...res.data.files.map(f => f.url)]
         }));
      } catch (err) {
         console.error('Upload failed:', err);
         alert('Failed to upload images');
      } finally {
         setUploading(false);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
         const res = await api.post(`/products/${productId}/reviews`, formData);
         if (onReviewAdded) onReviewAdded(res.data.data);
         setSuccess(true);
         setFormData({ rating: 5, comment: '', images: [], name: '', email: '' });
         setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
         console.error('Review submission error:', err);
         alert(err.response?.data?.message || 'Failed to submit review');
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="space-y-16">
         {/* Write Review Section */}
         <div className="max-w-2xl mx-auto space-y-10">
            <div className="text-center space-y-2">
               <h3 className="text-lg font-black uppercase tracking-tight">Client Feedback</h3>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest">Share your experience with the archive</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               {/* Rating */}
               <div className="flex flex-col items-center gap-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rating</label>
                  <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           type="button"
                           onMouseEnter={() => setHoverRating(star)}
                           onMouseLeave={() => setHoverRating(0)}
                           onClick={() => setFormData({ ...formData, rating: star })}
                           className="transition-transform hover:scale-110"
                        >
                           <Star
                              size={24}
                              className={cn(
                                 "transition-colors",
                                 (hoverRating || formData.rating) >= star
                                    ? "fill-black text-black"
                                    : "text-gray-200"
                              )}
                              strokeWidth={1}
                           />
                        </button>
                     ))}
                  </div>
               </div>

               {/* Comment */}
               <div className="space-y-2">
                  <label className="text-center block text-[10px] font-black uppercase tracking-widest text-gray-400">Review Content</label>
                  <textarea
                     value={formData.comment}
                     onChange={e => setFormData({ ...formData, comment: e.target.value })}
                     placeholder="Start writing here..."
                     className="w-full border border-gray-200 focus:border-black p-4 text-xs min-h-[120px] rounded-none focus:ring-0 transition-colors"
                     required
                  />
               </div>

               {/* Image Upload */}
               <div className="space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Picture/Video (Optional)</label>
                  <div className="flex gap-4 flex-wrap justify-center">
                     <div className="w-24 h-24 border border-dashed border-gray-300 hover:border-black transition-colors flex items-center justify-center relative cursor-pointer bg-brand-grey/30">
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} className="text-gray-400" />}
                        <input type="file" multiple accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                     </div>
                     {formData.images.map((img, i) => (
                        <div key={i} className="w-24 h-24 border border-gray-200 relative group">
                           <img src={img} alt="" className="w-full h-full object-cover grayscale" />
                           <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                              className="absolute top-0 right-0 p-1 bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X size={10} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               {/* User Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Name</label>
                     <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Public Name"
                        className="rounded-none border-gray-200 focus:border-black text-xs"
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                     <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="For Verification"
                        className="rounded-none border-gray-200 focus:border-black text-xs"
                        required
                     />
                  </div>
               </div>

               <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em]"
               >
                  {submitting ? 'Submitting Protocol...' : success ? 'Protocol Received' : 'Submit Review'}
               </Button>
            </form>
         </div>

         {/* Reviews List */}
         {reviews.length > 0 && (
            <div className="border-t border-black pt-16">
               <h3 className="text-center text-lg font-black uppercase tracking-tight mb-12">Archive Records ({reviews.length})</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                  {reviews.map((review, i) => (
                     <div key={i} className="space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-black uppercase tracking-widest">{review.name}</p>
                              <div className="flex text-black mt-1">
                                 {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} className={i < review.rating ? "fill-black" : "text-gray-200"} strokeWidth={0} />
                                 ))}
                              </div>
                           </div>
                           <span className="text-[9px] text-gray-400 uppercase tracking-widest">
                              {new Date(review.createdAt).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-gray-600 font-medium">
                           {review.comment}
                        </p>
                        {review.images?.length > 0 && (
                           <div className="flex gap-2 pt-2">
                              {review.images.map((img, idx) => (
                                 <div key={idx} className="w-16 h-16 border border-gray-100">
                                    <img src={img} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all cursor-zoom-in" />
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
}
