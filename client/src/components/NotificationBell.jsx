import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export function NotificationBell() {
   const { token, user } = useAuth();
   const navigate = useNavigate();
   const [isOpen, setIsOpen] = useState(false);
   const [notifications, setNotifications] = useState([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [loading, setLoading] = useState(false);
   const dropdownRef = useRef(null);

   useEffect(() => {
      if (token && user) {
         fetchNotifications();
      }
   }, [token, user]);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const fetchNotifications = async () => {
      setLoading(true);
      try {
         const res = await api.get('/notifications');
         if (res.data.success) {
            setNotifications(res.data.data);
            setUnreadCount(res.data.unreadCount);
         }
      } catch (error) {
         console.error('Error fetching notifications:', error);
         setNotifications([]); // Safe fallback
      } finally {
         setLoading(false);
      }
   };

   const markAsRead = async (notificationId) => {
      try {
         await api.put(`/notifications/${notificationId}/read`);
         setNotifications(notifications.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
         ));
         setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
         console.error('Error marking notification as read:', error);
      }
   };

   const markAllAsRead = async () => {
      try {
         await api.put('/notifications/read-all');
         setNotifications(notifications.map(n => ({ ...n, isRead: true })));
         setUnreadCount(0);
      } catch (error) {
         console.error('Error marking all as read:', error);
      }
   };

   const deleteNotification = async (notificationId) => {
      try {
         await api.delete(`/notifications/${notificationId}`);
         const deletedNotif = notifications.find(n => n._id === notificationId);
         setNotifications(notifications.filter(n => n._id !== notificationId));
         if (!deletedNotif.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
         }
      } catch (error) {
         console.error('Error deleting notification:', error);
      }
   };

   const handleNotificationClick = (notification) => {
      markAsRead(notification._id);
      setIsOpen(false);

      // Navigate based on notification type
      if (notification.type === 'order_status') {
         navigate('/profile');
      } else if (notification.type === 'contact_reply') {
         navigate('/contact');
      }
   };

   const getNotificationIcon = (type) => {
      switch (type) {
         case 'order_status':
            return '📦';
         case 'contact_reply':
            return '💬';
         default:
            return '🔔';
      }
   };

   if (!token || !user) return null;

   return (
      <div className="relative" ref={dropdownRef}>
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:opacity-50 transition-opacity relative"
         >
            <Bell size={18} strokeWidth={1.5} />
            {unreadCount > 0 && (
               <span className="absolute -top-1 -right-1 text-[8px] font-black w-4 h-4 flex items-center justify-center bg-red-600 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
               </span>
            )}
         </button>

         {isOpen && (
            <div className="fixed md:absolute right-4 md:right-0 top-16 md:top-full mt-2 w-[calc(100vw-2rem)] md:w-[400px] max-h-[80vh] md:max-h-[600px] bg-white border-2 border-black shadow-lg z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
               {/* Header */}
               <div className="p-4 border-b border-black flex justify-between items-center bg-brand-grey">
                  <h3 className="text-[11px] font-black uppercase tracking-widest">Notifications</h3>
                  <div className="flex items-center gap-2">
                     {unreadCount > 0 && (
                        <button
                           onClick={markAllAsRead}
                           className="text-[9px] font-bold uppercase tracking-widest hover:opacity-50 flex items-center gap-1"
                        >
                           <Check size={12} />
                           Mark all read
                        </button>
                     )}
                     <button onClick={() => setIsOpen(false)} className="hover:opacity-50">
                        <X size={16} />
                     </button>
                  </div>
               </div>

               {/* Notifications List */}
               <div className="max-h-[500px] overflow-y-auto">
                  {loading ? (
                     <div className="p-8 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Loading...</p>
                     </div>
                  ) : notifications.length === 0 ? (
                     <div className="p-8 text-center">
                        <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                           No notifications yet
                        </p>
                     </div>
                  ) : (
                     notifications.map((notification) => (
                        <div
                           key={notification._id}
                           className={`p-4 border-b border-gray-200 hover:bg-brand-grey transition-colors cursor-pointer group ${!notification.isRead ? 'bg-blue-50' : ''
                              }`}
                           onClick={() => handleNotificationClick(notification)}
                        >
                           <div className="flex gap-3">
                              <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-tight">
                                       {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                       <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                                    )}
                                 </div>
                                 <p className="text-[9px] font-medium leading-relaxed text-gray-700 mb-2">
                                    {notification.message}
                                 </p>
                                 <div className="flex justify-between items-center">
                                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                                       {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                       {new Date(notification.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                       })}
                                    </p>
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notification._id);
                                       }}
                                       className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600"
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Footer */}
               {notifications.length > 0 && (
                  <div className="p-3 border-t border-black bg-brand-grey text-center">
                     <button
                        onClick={() => {
                           setIsOpen(false);
                           navigate('/profile');
                        }}
                        className="text-[9px] font-black uppercase tracking-widest hover:opacity-50"
                     >
                        View All in Profile
                     </button>
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
