import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
   const [cart, setCart] = useState([]);
   const [loading, setLoading] = useState(true);
   const { token } = useAuth();

   const fetchCart = async () => {
      if (token) {
         try {
            // First, check if there's a local cart to sync
            const localCart = JSON.parse(localStorage.getItem('cart')) || [];

            if (localCart.length > 0) {
               // Sync local items to server one by one (or potentially add a bulk sync endpoint)
               // For now, we'll iterate to ensure consistency with existing logic
               for (const item of localCart) {
                  await api.post('/cart', {
                     productId: item.product._id,
                     quantity: item.quantity,
                     size: item.size
                  });
               }
               // Clear local storage after successful sync
               localStorage.removeItem('cart');
            }

            const res = await api.get('/cart');
            setCart(res.data.data.items);
         } catch (err) {
            console.error('Error fetching/merging cart:', err.response?.data?.message || err.message);
         } finally {
            setLoading(false);
         }
      } else {
         const localCart = JSON.parse(localStorage.getItem('cart')) || [];
         setCart(localCart);
         setLoading(false);
      }
   };

   useEffect(() => {
      setLoading(true);
      fetchCart();
   }, [token]);

   const addToCart = async (product, quantity, size) => {
      if (token) {
         try {
            const res = await api.post('/cart', {
               productId: product._id,
               quantity,
               size
            });
            setCart(res.data.data.items);
         } catch (err) {
            console.error('Error adding to cart:', err);
         }
      } else {
         const localCart = JSON.parse(localStorage.getItem('cart')) || [];
         const index = localCart.findIndex(item => item.product._id === product._id && item.size === size);
         if (index > -1) {
            localCart[index].quantity += quantity;
         } else {
            localCart.push({ product, quantity, size });
         }
         setCart([...localCart]);
         localStorage.setItem('cart', JSON.stringify(localCart));
      }
   };

   const removeFromCart = async (productId, size) => {
      if (token) {
         try {
            const res = await api.delete(`/cart/${productId}/${size}`);
            setCart(res.data.data.items);
         } catch (err) {
            console.error('Error removing from cart:', err);
         }
      } else {
         const localCart = JSON.parse(localStorage.getItem('cart')) || [];
         const updatedCart = localCart.filter(item => !(item.product._id === productId && item.size === size));
         setCart(updatedCart);
         localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
   };

   const updateQuantity = async (productId, size, quantity) => {
      // Optimistic Update
      const previousCart = [...cart];
      const updatedCart = cart.map(item =>
         (item.product._id === productId && item.size === size)
            ? { ...item, quantity }
            : item
      );

      setCart(updatedCart);
      if (!token) {
         localStorage.setItem('cart', JSON.stringify(updatedCart));
      }

      if (token) {
         try {
            const res = await api.put('/cart', {
               productId,
               size,
               quantity
            });
            setCart(res.data.data.items);
         } catch (err) {
            console.error('Error updating cart:', err);
            // Rollback on failure
            setCart(previousCart);
         }
      }
   };

   const clearCart = async () => {
      if (token) {
         try {
            await api.delete('/cart');
         } catch (err) {
            console.error('Error clearing database cart:', err);
         }
      }
      setCart([]);
      localStorage.removeItem('cart');
   };

   return (
      <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart }}>
         {children}
      </CartContext.Provider>
   );
};
