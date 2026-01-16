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
      params.append('recipient_address', order.shippingAddress.address || '');

      // City Sanitization Map for Fadar
      // Fadar rejects "Colombo 01". Mapping to "Colombo 1".
      let fadarCity = order.shippingAddress.city || '';
      if (fadarCity.toLowerCase().startsWith('colombo 0')) {
         fadarCity = fadarCity.replace(/Colombo 0/i, 'Colombo ');
      }
      params.append('recipient_city', fadarCity);

      const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
      const codAmount = isCod ? order.totalPrice.toString() : '0';

      params.append('amount', codAmount);
      params.append('exchange', 'no'); // Defaulting to 'no', adjust if needed

      // Log the payload for debugging (Redact API Key)
      const debugParams = new URLSearchParams(params);
      debugParams.set('api_key', 'REDACTED');
      const debugParamsObj = Object.fromEntries(debugParams.entries());
      console.log(`[FADAR PARAMETERS]`, debugParams.toString());

      const response = await axios.post('https://www.fdedomestic.com/api/parcel/new_api_v1.php', params, {
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
         }
      });

      console.log(`[FADAR] API RAW RESPONSE:`, response.data);

      if (response.data) {
         // The Fadar API response structure can vary; we check for known ID fields
         const fadarId = response.data.fadar_order_id || response.data.order_id || response.data.id;

         if (!fadarId) {
            console.error(`[FADAR FAILURE] No Order ID in response for Order ${order._id}:`, response.data);

            if (response.data.status === '212' || response.data.status === 212) {
               console.warn('[FADAR HINT] Status 212 usually indicates an Invalid City. Please verify the city name against the Fadar approved list.');
            }

            // Extract specific error reason from upstream API
            // Fadar might return error in various fields depending on the failure type
            let upstreamError = 'Courier API accepted the request but did not return a tracking ID.';

            if (response.data) {
               if (typeof response.data === 'string') {
                  upstreamError = response.data;
               } else {
                  upstreamError = response.data.msg ||
                     response.data.message ||
                     response.data.error ||
                     response.data.description ||
                     JSON.stringify(response.data);
               }
            }

            return res.status(400).json({
               success: false,
               message: `FADAR REJECTED: ${upstreamError}`,
               error: response.data,
               debugParams: debugParamsObj
            });
         }

         order.fadar_order_id = fadarId;
         order.status = 'processing';
         const updatedOrder = await order.save();

         console.log(`[FADAR SUCCESS] Order ${order._id} synchronized with Fadar ID: ${order.fadar_order_id}`);

         return res.status(200).json({
            success: true,
            data: response.data,
            order: updatedOrder
         });
      }

      console.warn(`[FADAR] API returned empty payload for Order ${order._id}`);
      return res.status(500).json({
         success: false,
         message: 'Courier API returned an empty response. Connection might be unstable.'
      });

   } catch (err) {
      console.error('[FADAR PROTOCOL ERROR]:', err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
         success: false,
         message: 'Critical failure during Fadar synchronization.',
         error: err.response?.data || err.message
      });
   }
};
