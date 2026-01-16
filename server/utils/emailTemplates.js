/**
 * Luzzio Architectural Email Templates
 * Premium Dark Theme - Optimized for Inbox Delivery & High Fidelity Visuals.
 */

const baseTemplate = (content, title, preheader) => `
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>${title}</title>
   <style>
      body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      .container { max-width: 600px; margin: 0 auto; background-color: #111111; }
      .content { padding: 40px; }
      .header { border-bottom: 1px solid #333333; padding-bottom: 20px; }
      .footer { border-top: 1px solid #333333; padding-top: 20px; text-align: center; color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
      .btn { display: inline-block; padding: 12px 24px; background-color: #2b7a5a; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; }
      .text-dim { color: #999999; }
      .divider { border-bottom: 1px solid #333333; margin: 20px 0; }
      .item-row td { padding: 15px 0; border-bottom: 1px solid #222222; }
      .summary-row td { padding: 5px 0; }
      .total-row td { padding: 15px 0; font-size: 18px; font-weight: bold; }
      .address-box { font-size: 13px; line-height: 1.6; color: #cccccc; }
      h1, h2, h3, h4 { margin: 0; text-transform: uppercase; letter-spacing: 2px; }
      img { max-width: 100%; height: auto; display: block; }
   </style>
</head>
<body>
   ${preheader ? `<div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${preheader}</div>` : ''}
   <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
         <td align="center" style="padding: 20px;">
            <table role="presentation" class="container" cellspacing="0" cellpadding="0">
               <tr>
                  <td class="content">
                     ${content}
                     <div class="footer">
                        <div style="margin-bottom: 10px;">LUZZIO</div>
                        &copy; ${new Date().getFullYear()} LUZZIO | ALL RIGHTS RESERVED
                     </div>
                  </td>
               </tr>
            </table>
         </td>
      </tr>
   </table>
</body>
</html>
`;

const renderItems = (items) => items.map(item => `
   <tr class="item-row">
      <td width="80" style="vertical-align: top; padding-right: 15px;">
         <img src="${item.image}" width="70" style="border-radius: 4px; border: 1px solid #333;">
      </td>
      <td style="vertical-align: top;">
         <div style="font-size: 14px; font-weight: bold;">${item.name}</div>
         <div style="font-size: 12px; color: #999; margin-top: 4px;">${item.price.toLocaleString()} x ${item.qty}</div>
         <div style="font-size: 11px; color: #666; margin-top: 2px;">SIZE: ${item.size}</div>
      </td>
      <td align="right" style="vertical-align: top; font-size: 14px; font-weight: bold;">
         Rs ${(item.price * item.qty).toLocaleString()}.00
      </td>
   </tr>
`).join('');

exports.orderConfirmationTemplate = (order, user) => {
   const orderIdShort = order._id.toString().slice(-6).toUpperCase();
   const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   const timeStr = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

   const content = `
      <div class="header" style="text-align: left; margin-bottom: 30px;">
         <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; color: #ffffff;">${user.name} placed order #${orderIdShort} on ${dateStr} at ${timeStr}</h2>
         </div>
         <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}/profile" class="btn">View order</a>
      </div>

      <div style="margin-bottom: 30px;">
         <h4 style="font-size: 12px; margin-bottom: 20px;">Order summary</h4>
         <table role="presentation">
            ${renderItems(order.orderItems)}
         </table>
      </div>

      <div style="margin-bottom: 30px;">
         <table role="presentation">
            <tr class="summary-row">
               <td class="text-dim" style="font-size: 14px;">Subtotal</td>
               <td align="right" style="font-size: 14px;">Rs ${order.itemsPrice.toLocaleString()}.00</td>
            </tr>
            <tr class="summary-row">
               <td class="text-dim" style="font-size: 14px;">Shipping <span style="font-size: 11px;">(DELIVERY FEE)</span></td>
               <td align="right" style="font-size: 14px;">Rs ${order.shippingPrice.toLocaleString()}.00</td>
            </tr>
            <tr class="total-row">
               <td style="border-top: 1px solid #333;">Total</td>
               <td align="right" style="border-top: 1px solid #333;">Rs ${order.totalPrice.toLocaleString()}.00 LKR</td>
            </tr>
         </table>
      </div>

      <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
         <div style="margin-bottom: 20px;">
            <h4 style="font-size: 11px; margin-bottom: 8px;">Payment processing method</h4>
            <div style="font-size: 13px; color: #ccc;">${order.paymentMethod}</div>
         </div>
         <div style="margin-bottom: 20px;">
            <h4 style="font-size: 11px; margin-bottom: 8px;">Delivery method</h4>
            <div style="font-size: 13px; color: #ccc;">DELIVERY FEE</div>
         </div>
         <div style="margin-bottom: 20px;">
            <h4 style="font-size: 11px; margin-bottom: 8px;">Shipping address</h4>
            <div class="address-box">
               ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
               ${order.shippingAddress.address}<br>
               ${order.shippingAddress.city}, ${order.shippingAddress.postalCode || ''}<br>
               Sri Lanka<br>
               ${order.shippingAddress.phone}
            </div>
         </div>
      </div>
   `;

   return baseTemplate(content, `Order Confirmation #${orderIdShort}`, `Thank you for your purchase. Order #${orderIdShort} has been received.`);
};

exports.trackingUpdateTemplate = (order, item, trackingNumber, user) => {
   const orderIdShort = order._id.toString().slice(-6).toUpperCase();

   const content = `
      <div class="header" style="text-align: left; margin-bottom: 30px;">
         <h1 style="font-size: 24px; margin-bottom: 10px;">LUZZIO</h1>
         <div style="font-size: 12px; color: #999; letter-spacing: 4px;">LOGISTICS UPDATE</div>
      </div>

      <div style="margin-bottom: 30px;">
         <p style="font-size: 14px; line-height: 1.6; color: #cccccc;">
            Hello ${user.name}, your shipment is on the way. A tracking number has been registered for an item in your selection.
         </p>
      </div>

      <div style="padding: 25px; background-color: #1a1a1a; border: 1px solid #333; border-radius: 4px; margin-bottom: 30px;">
         <table role="presentation">
            <tr>
               <td>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Item</div>
                  <div style="font-size: 15px; font-weight: bold; margin-top: 5px;">${item.name}</div>
               </td>
               <td align="right">
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Tracking Number</div>
                  <div style="font-size: 15px; font-weight: bold; margin-top: 5px; color: #ffffff;">${trackingNumber}</div>
               </td>
            </tr>
         </table>
      </div>

      <div style="text-align: center; margin-bottom: 40px;">
         <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}/profile" class="btn">Track Order Registry</a>
      </div>
   `;

   return baseTemplate(content, "Shipment Update", `Tracking updated for your order selection.`);
};

exports.adminOrderNotificationTemplate = (order) => {
   const orderIdShort = order._id.toString().slice(-6).toUpperCase();

   const content = `
      <div class="header" style="margin-bottom: 30px; border-bottom: 2px solid #2b7a5a;">
         <h1 style="font-size: 20px; color: #ffffff;">NEW ORDER RECEIVED</h1>
         <div style="font-size: 9px; color: #2b7a5a; font-weight: bold; margin-top: 5px;">PROTOCOL: ACTION REQUIRED</div>
      </div>

      <div style="margin-bottom: 30px;">
         <table role="presentation">
            <tr>
               <td style="padding: 10px 0; font-size: 13px; color: #999;">Order ID</td>
               <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: bold;">${order._id}</td>
            </tr>
            <tr>
               <td style="padding: 10px 0; font-size: 13px; color: #999;">Customer</td>
               <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: bold;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</td>
            </tr>
            <tr>
               <td style="padding: 10px 0; font-size: 13px; color: #999;">Value</td>
               <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #2b7a5a;">Rs ${order.totalPrice.toLocaleString()}.00</td>
            </tr>
         </table>
      </div>

      <div style="margin-bottom: 30px;">
         <h4 style="font-size: 11px; margin-bottom: 15px; color: #666;">Items to pack</h4>
         <table role="presentation">
            ${order.orderItems.map(item => `
               <tr>
                  <td style="padding: 8px 0; font-size: 13px; border-bottom: 1px solid #222;">${item.name} (${item.size})</td>
                  <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #222;">${item.qty} UNITS</td>
               </tr>
            `).join('')}
         </table>
      </div>

      <div style="text-align: center; margin-top: 20px;">
         <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}/admin/orders" class="btn" style="background-color: #ffffff; color: #000000;">Manage in Admin Panel</a>
      </div>
   `;

   return baseTemplate(content, "Admin: New Order Notification", `Order #${orderIdShort} has been received and is pending processing.`);
};

exports.paymentSuccessTemplate = (order, is_admin = false) => {
   // Protocol: Re-use the high-fidelity confirmation template for both initial recording and payment success
   // This ensures the customer gets the detailed receipt they expect.
   if (!is_admin) {
      return exports.orderConfirmationTemplate(order, { name: order.shippingAddress.firstName });
   }
   return exports.adminOrderNotificationTemplate(order);
};
