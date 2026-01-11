const axios = require('axios');
const Order = require('../models/Order');

// @desc    Create a new parcel booking with Fadar
// @route   POST /api/fadar/create-parcel
// @access  Private/Admin
exports.createFadarParcel = async (req, res) => {
   try {
      const { orderId, parcel_weight, newStatus, oldStatus } = req.body;

      // Status Guard Logic
      // Call Fadar API ONLY when: oldStatus !== "processing" AND newStatus === "processing"
      if (oldStatus === 'processing' || newStatus !== 'processing') {
         return res.status(400).json({
            success: false,
            message: 'Status change does not trigger Fadar booking.'
         });
      }

      const order = await Order.findById(orderId);
      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Prevent duplicate courier creation
      if (order.fadar_order_id) {
         return res.status(400).json({
            success: false,
            message: 'A parcel has already been booked with Fadar for this order.',
            fadar_order_id: order.fadar_order_id
         });
      }

      const apiKey = process.env.FADAR_API_KEY;
      const clientId = process.env.FADAR_CLIENT_ID;

      if (!apiKey || !clientId) {
         return res.status(500).json({
            success: false,
            message: 'Fadar API configuration missing in .env'
         });
      }

      // Prepare Fadar API Request Body
      // Use application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('api_key', apiKey);
      params.append('client_id', clientId);
      params.append('order_id', order._id.toString());
      params.append('parcel_weight', parcel_weight && parcel_weight > 0 ? parcel_weight.toString() : '1'); // Default to 1kg if not provided or invalid
      params.append('parcel_description', `Order #${order._id.toString().slice(-6).toUpperCase()}`);
      params.append('recipient_name', `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim());
      params.append('recipient_contact_1', order.shippingAddress.phone || '');
      params.append('recipient_contact_2', order.shippingAddress.phone2 || '');
      params.append('recipient_address', order.shippingAddress.address || '');
      params.append('recipient_city', order.shippingAddress.city || '');
      params.append('amount', order.totalPrice.toString());
      params.append('exchange', 'no'); // Defaulting to 'no', adjust if needed

      // Call Fadar API
      const response = await axios.post('https://www.fdedomestic.com/api/parcel/new_api_v1.php', params, {
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
         }
      });

      // Expected response might contain an order ID or success message
      // Return raw response as requested
      if (response.data) {
         // If Fadar returns a specific ID, we store it to prevent duplicates
         // Assuming Fadar returns { status: 'success', fadar_order_id: '...' } or similar
         // Adjust based on actual API behavior. For now, we store something to flag it as booked.

         order.fadar_order_id = response.data.fadar_order_id || 'CREATED_' + Date.now();
         order.status = 'processing';
         await order.save();
      }

      res.status(200).json({
         success: true,
         data: response.data
      });

   } catch (err) {
      console.error('Fadar API Error:', err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
         success: false,
         message: 'Failed to book parcel with Fadar',
         error: err.response?.data || err.message
      });
   }
};
