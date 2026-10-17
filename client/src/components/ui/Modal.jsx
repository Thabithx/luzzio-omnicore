import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Global Portal Modal Component
 * Ensures all admin modals render outside the layout hierarchy directly into document.body
 * with maximum z-index, background scroll locking, and smooth centering to eliminate
 * header overlap, white bar artifacts, and layout jumping.
 */
export function Modal({ isOpen = true, onClose, children, className = '' }) {
   useEffect(() => {
      if (isOpen) {
         const originalOverflow = document.body.style.overflow;
         document.body.style.overflow = 'hidden';
         return () => {
            document.body.style.overflow = originalOverflow;
         };
      }
   }, [isOpen]);

   if (!isOpen) return null;

   return createPortal(
      <div
         className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto ${className}`}
         onClick={(e) => {
            if (e.target === e.currentTarget && onClose) {
               onClose();
            }
         }}
      >
         {children}
      </div>,
      document.body
   );
}

export default Modal;
