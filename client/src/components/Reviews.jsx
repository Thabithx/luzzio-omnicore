import React, { useState } from 'react';
import { Star, Upload, X, Check, Loader2, Award, ShieldCheck, ChevronDown, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import api from '../services/api';

export function Reviews({ productId, reviews = [], onReviewAdded }) {
   // Sort reviews by date (newest first)
   const sortedReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

   const [isWritingReview, setIsWritingReview] = useState(false);
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
         const res = await api.post('/upload/public', uploadData, {
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
         setTimeout(() => {
            setSuccess(false);
            setIsWritingReview(false);
         }, 2000);
      } catch (err) {
         console.error('Review submission error:', err);
         alert(err.response?.data?.message || 'Failed to submit review');
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="space-y-12 max-w-3xl mx-auto">
         {/* HEADER DASHBOARD */}
         <div className="flex flex-col items-center space-y-8 pb-8">
            <div className="flex justify-center gap-12 md:gap-20">
               {/* Authenticity Badge */}
               <div className="flex flex-col items-center gap-3">
                  <div className="relative w-24 h-24 flex items-center justify-center p-4">
                     {/* Wreath Graphic using standard border tricks or SVG if possible, using Icon for now */}
                     <Award size={80} className="text-black stroke-[0.8px] opacity-100" />
                     <div className="absolute inset-0 flex items-center justify-center pt-2">
                        <span className="text-[11px] font-black tracking-tighter">89.5</span>
                     </div>
                  </div>
                  <div className="text-center space-y-0.5">
                     <span className="block text-[8px] md:text-[9px] uppercase font-bold tracking-[0.2em] text-black/40">Bronze</span>
                     <span className="block text-[8px] md:text-[9px] uppercase font-bold tracking-[0.2em] text-black">Authenticity</span>
                  </div>
               </div>

               {/* Transparency Badge */}
               <div className="flex flex-col items-center gap-3">
                  <div className="relative w-24 h-24 flex items-center justify-center p-4">
                     <ShieldCheck size={76} className="text-black stroke-[0.8px] opacity-100" />
                     <div className="absolute inset-0 flex items-center justify-center pt-1">
                        <span className="text-[11px] font-black tracking-tighter">94.4</span>
                     </div>
                  </div>
                  <div className="text-center space-y-0.5">
                     <span className="block text-[8px] md:text-[9px] uppercase font-bold tracking-[0.2em] text-black/40">Silver</span>
                     <span className="block text-[8px] md:text-[9px] uppercase font-bold tracking-[0.2em] text-black">Transparency</span>
                  </div>
               </div>
            </div>

            {/* Overall Verified Status */}
            <div className="flex items-center gap-2 text-black pt-2">
               <span className="text-xs font-semibold tracking-tight text-black">Verified</span>
               <div className="bg-black text-white p-[2px] rounded-[2px]">
                  <Check size={10} strokeWidth={4} />
               </div>
            </div>
         </div>

         {/* CONTROLS & WRITE REVIEW TOGGLE */}
         <div className="flex justify-between items-center border-b border-black/10 pb-4">
            <div className="flex items-center gap-2 cursor-pointer group">
               <span className="text-xs font-bold text-black group-hover:opacity-70 transition-opacity">Most Recent</span>
               <ChevronDown size={14} className="text-black" />
            </div>
            <button
               onClick={() => setIsWritingReview(!isWritingReview)}
               className="text-[10px] md:text-xs font-black tracking-[0.15em] uppercase hover:opacity-60 transition-opacity border-b border-black pb-0.5"
            >
               {isWritingReview ? "Cancel Review" : "Write a Review"}
            </button>
         </div>

         {/* WRITE REVIEW FORM */}
         {isWritingReview && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-gray-50/50 p-6 md:p-10 border border-black/5">
               <div className="text-center space-y-2 mb-8">
                  <h3 className="text-sm font-black uppercase tracking-tight">Submit Protocol</h3>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div className="flex justify-center gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           type="button"
                           onMouseEnter={() => setHoverRating(star)}
                           onMouseLeave={() => setHoverRating(0)}
                           onClick={() => setFormData({ ...formData, rating: star })}
                           className="transition-transform hover:scale-110 focus:outline-none"
                        >
                           <Star
                              size={20}
                              className={cn(
                                 "transition-colors",
                                 (hoverRating || formData.rating) >= star
                                    ? "fill-black text-black"
                                    : "text-gray-200"
                              )}
                              strokeWidth={0}
                           />
                        </button>
                     ))}
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Name"
                        className="bg-white border-gray-200 text-xs py-3"
                        required
                     />
                     <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Email"
                        className="bg-white border-gray-200 text-xs py-3"
                        required
                     />
                  </div>
                  <textarea
                     value={formData.comment}
                     onChange={e => setFormData({ ...formData, comment: e.target.value })}
                     placeholder="Share your experience..."
                     className="w-full bg-white border border-gray-200 p-4 text-xs min-h-[100px] focus:border-black focus:ring-0 transition-colors resize-none"
                     required
                  />

                  {/* Image Upload */}
                  <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 border border-dashed border-gray-300 flex items-center justify-center relative hover:border-black cursor-pointer bg-white transition-colors">
                        {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} className="text-gray-400" />}
                        <input type="file" multiple accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                     </div>
                     <div className="flex gap-2 overflow-x-auto">
                        {formData.images.map((img, i) => (
                           <div key={i} className="w-12 h-12 relative group flex-shrink-0">
                              <img src={img} alt="" className="w-full h-full object-cover grayscale" />
                              <button
                                 type="button"
                                 onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                 className="absolute -top-1 -right-1 bg-black text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full block"
                              >
                                 <X size={8} />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  <Button
                     type="submit"
                     disabled={submitting || uploading}
                     className="w-full bg-black text-white hover:bg-stone-800 text-[10px] font-black uppercase tracking-[0.2em] py-4"
                  >
                     {submitting ? 'Processing...' : success ? 'Submitted' : 'Post Review'}
                  </Button>
               </form>
            </div>
         )}

         {/* REVIEWS LIST */}
         <div className="space-y-10">
            {sortedReviews.map((review, i) => (
               <div key={i} className="flex flex-col gap-3 pb-8 border-b border-gray-100 last:border-0 fade-in">
                  {/* Rating Stars */}
                  <div className="flex gap-1">
                     {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? "fill-black text-black" : "text-gray-200"} strokeWidth={0} />
                     ))}
                  </div>

                  {/* User Info Line */}
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-sm bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                        <User size={14} />
                     </div>
                     <span className="text-[13px] font-medium text-black/80 tracking-tight">{review.name || "Anonymous"}</span>
                     <div className="flex items-center gap-1 bg-black text-white px-1.5 py-[2px] rounded-[1px]">
                        <span className="text-[9px] font-bold uppercase tracking-wider">Verified</span>
                     </div>
                  </div>

                  {/* Comment */}
                  <div className=" text-black/80 font-normal leading-relaxed text-[13px]">
                     <p>{review.comment}</p>
                  </div>

                  {/* Date (Right Aligned or Inline) */}
                  <div className="text-right">
                     <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                        {new Date(review.createdAt).toLocaleDateString()}
                     </span>
                  </div>

                  {/* Review Images */}
                  {review.images?.length > 0 && (
                     <div className="flex gap-2 pt-1">
                        {review.images.map((img, idx) => (
                           <div key={idx} className="w-20 h-20 border border-gray-100 bg-gray-50">
                              <img src={img} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-zoom-in" />
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            ))}

            {reviews.length === 0 && !isWritingReview && (
               <div className="text-center py-16 space-y-4">
                  <p className="text-xs uppercase tracking-widest text-gray-400">No archival records yet</p>
                  <button
                     onClick={() => setIsWritingReview(true)}
                     className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-black pb-1 hover:opacity-50"
                  >
                     Be the First to Review
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}
