/**
 * Meta Pixel (Facebook Pixel) Utility
 * Following best practices for React integration
 */

export const PIXEL_ID = import.meta.env.VITE_PIXEL_ID;

const isEnabled = () => typeof window !== 'undefined' && !!window.fbq && !!PIXEL_ID;

export const init = () => {
   if (typeof window === 'undefined' || !PIXEL_ID) return;

   // Standard Meta Pixel initialization script
   if (!window.fbq) {
      !(function (f, b, e, v, n, t, s) {
         if (f.fbq) return;
         n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
         };
         if (!f._fbq) f._fbq = n;
         n.push = n;
         n.loaded = !0;
         n.version = '2.0';
         n.queue = [];
         t = b.createElement(e);
         t.async = !0;
         t.src = v;
         s = b.getElementsByTagName(e)[0];
         s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', PIXEL_ID);
      console.debug(`[Meta Pixel] Initialized with ID: ${PIXEL_ID}`);
   }
};

export const pageview = () => {
   if (!isEnabled()) return;
   window.fbq('track', 'PageView');
   console.debug('[Meta Pixel] Event: PageView');
};

export const viewContent = (product) => {
   if (!isEnabled() || !product) return;
   window.fbq('track', 'ViewContent', {
      content_name: product.name,
      content_category: Array.isArray(product.categories) ? product.categories[0]?.name : '',
      content_ids: [product._id],
      content_type: 'product',
      value: product.salePrice || product.price,
      currency: 'LKR',
   });
   console.debug('[Meta Pixel] Event: ViewContent', product.name);
};

export const addToCart = (product, quantity = 1, size = '', color = '') => {
   if (!isEnabled() || !product) return;
   window.fbq('track', 'AddToCart', {
      content_name: product.name,
      content_ids: [product._id],
      content_type: 'product',
      value: (product.salePrice || product.price) * quantity,
      currency: 'LKR',
      content_items: [{
         id: product._id,
         quantity: quantity,
         item_price: product.salePrice || product.price,
         size,
         color
      }]
   });
   console.debug('[Meta Pixel] Event: AddToCart', product.name);
};

export const purchase = (order) => {
   if (!isEnabled() || !order) return;
   window.fbq('track', 'Purchase', {
      content_ids: order.orderItems.map(item => item.product),
      content_type: 'product',
      value: order.totalPrice,
      currency: 'LKR',
      order_id: order._id,
      num_items: order.orderItems.reduce((acc, item) => acc + (item.qty || 1), 0)
   });
   console.debug('[Meta Pixel] Event: Purchase', order._id);
};

export const trackCustom = (event, data = {}) => {
   if (!isEnabled()) return;
   window.fbq('trackCustom', event, data);
   console.debug(`[Meta Pixel] Custom Event: ${event}`, data);
};
