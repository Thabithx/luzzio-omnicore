/**
 * Luzzio Architectural Email Templates
 * Premium Light Theme - High Reliability & Clean Aesthetic
 */

const baseTemplate = (content, title, preheader) => `
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>${title}</title>
   <style>
      body { margin: 0; padding: 0; background-color: #F4F4F4; color: #000000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
      table { border-collapse: collapse; width: 100%; }
      .wrapper { width: 100%; table-layout: fixed; background-color: #F4F4F4; padding-bottom: 40px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
      .content { padding: 40px; }
      .header { border-bottom: 2px solid #000000; padding: 30px 40px; text-align: center; }
      .footer { padding: 30px 40px; text-align: center; background-color: #F9F9F9; border-top: 1px solid #E5E5E5; }
      
      /* Typography */
      h1 { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #000000; }
      h2 { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; color: #000000; }
      p { margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #333333; }
      .text-small { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666; font-weight: 600; }
      .text-bold { font-weight: 700; color: #000000; }
      
      /* Components */
      .btn { display: inline-block; padding: 14px 28px; background-color: #000000; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
      .divider { border-bottom: 1px solid #E5E5E5; margin: 20px 0; }
      
      /* Tables */
      .item-row td { padding: 15px 0; border-bottom: 1px solid #E5E5E5; vertical-align: top; }
      .total-row td { padding: 15px 0; font-size: 16px; font-weight: 700; border-top: 2px solid #000000; color: #000000; }
      
      /* Utilities */
      .mb-20 { margin-bottom: 20px; }
      .mb-30 { margin-bottom: 30px; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
   </style>
</head>
<body>
   ${preheader ? `<div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${preheader}</div>` : ''}
   <div class="wrapper">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
         <tr>
            <td align="center" style="padding-top: 20px; padding-bottom: 20px;">
               <table role="presentation" class="container" cellspacing="0" cellpadding="0">
                  <!-- BRAND HEADER -->
                  <tr>
                     <td class="header">
                        <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}" style="text-decoration: none; color: #000000;">
                           <h1>LUZZIO</h1>
                        </a>
                     </td>
                  </tr>
                  
                  <!-- MAIN CONTENT -->
                  <tr>
                     <td class="content">
                        ${content}
                     </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                     <td class="footer">
                        <p class="text-small" style="margin-bottom: 10px;">
                           &copy; ${new Date().getFullYear()} Luzzio | Sri Lanka
                        </p>
                        <div style="margin-bottom: 10px;">
                           <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}" style="color: #666666; text-decoration: none; font-size: 11px; margin: 0 5px;">Shop</a>
                           <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}/profile" style="color: #666666; text-decoration: none; font-size: 11px; margin: 0 5px;">Account</a>
                        </div>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </div>
</body>
</html>
`;

const renderItems = (items) => items.map(item => `
   <tr class="item-row">
      <td>
         <div class="text-bold" style="font-size: 13px; margin-bottom: 4px;">${item.name}</div>
         <div class="text-small">Size: ${item.size}</div>
         <div class="text-small" style="margin-top: 2px;">Qty: ${item.qty}</div>
      </td>
      <td class="text-right" style="font-size: 13px; font-weight: 700;">
         Rs ${(item.price * item.qty).toLocaleString()}.00
      </td>
   </tr>
`).join('');

exports.orderConfirmationTemplate = (order, user, isAdmin = false) => {
   const orderIdShort = order._id.toString().slice(-6).toUpperCase();
   const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
   const customerName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;

   const content = `
      <div class="mb-30 text-center">
         <h2 style="font-size: 20px; margin-bottom: 10px;">${isAdmin ? 'New Order Received' : 'Order Confirmed'}</h2>
         <p style="color: #666666;">
            ${isAdmin ? `A new order has been placed by ${customerName}.` : `Thank you for your purchase, ${user.name || order.shippingAddress.firstName}.`}
         </p>
         <div class="text-small" style="margin-top: 5px;">Order #${orderIdShort} • ${dateStr}</div>
      </div>

      <div class="mb-30">
         <table role="presentation">
            ${renderItems(order.orderItems)}
         </table>
      </div>

      <div class="mb-30">
         <table role="presentation">
            <tr>
               <td style="padding: 5px 0; color: #666666;">Subtotal</td>
               <td class="text-right" style="padding: 5px 0;">Rs ${order.itemsPrice.toLocaleString()}.00</td>
            </tr>
            <tr>
               <td style="padding: 5px 0; color: #666666;">Shipping</td>
               <td class="text-right" style="padding: 5px 0;">Rs ${order.shippingPrice.toLocaleString()}.00</td>
            </tr>
            <tr class="total-row">
               <td>Total</td>
               <td class="text-right">Rs ${order.totalPrice.toLocaleString()}.00 LKR</td>
            </tr>
         </table>
      </div>

      <div class="mb-30" style="border-top: 1px solid #E5E5E5; padding-top: 20px;">
         <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px;">Customer Details</h3>
         <table role="presentation">
            <tr>
               <td width="50%" style="vertical-align: top; padding-right: 10px;">
                  <div class="text-small mb-20">Shipping Address</div>
                  <div style="font-size: 13px; line-height: 1.5; color: #333;">
                     ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                     ${order.shippingAddress.address}<br>
                     ${order.shippingAddress.city}<br>
                     ${order.shippingAddress.phone}
                  </div>
               </td>
               <td width="50%" style="vertical-align: top;">
                  <div class="text-small mb-20">Payment</div>
                  <div style="font-size: 13px; line-height: 1.5; color: #333;">
                     ${order.paymentMethod}<br>
                     Total: Rs ${order.totalPrice.toLocaleString()}
                  </div>
               </td>
            </tr>
         </table>
      </div>

      <div class="text-center">
         <a href="${process.env.CLIENT_URL || 'https://luzziopremium.com'}/${isAdmin ? 'admin/orders' : 'profile'}?order=${order._id}" class="btn">
            ${isAdmin ? 'Manage Order' : 'View Order'}
         </a>
      </div>
   `;

   const subject = isAdmin ? `New Order Received #${orderIdShort}` : `Order Confirmed #${orderIdShort}`;
   const preheader = isAdmin ? `New order received from ${customerName}.` : `Your order #${orderIdShort} has been received.`;

   return baseTemplate(content, subject, preheader);
};

exports.trackingUpdateTemplate = (order, trackingNumber, user) => {
   const orderIdShort = order._id.toString().slice(-6).toUpperCase();

   const content = `
      <div class="mb-30 text-center">
         <h2 style="font-size: 20px; margin-bottom: 10px;">Shipment Dispatched</h2>
         <p style="color: #666666;">Good news ${user.name}, your order has been handed over to our courier partner.</p>
      </div>

      <div class="mb-30" style="background-color: #F9F9F9; padding: 20px; border: 1px solid #E5E5E5;">
         <div class="text-center mb-20">
            <div class="text-small" style="margin-bottom: 5px;">Tracking Reference</div>
            <div style="font-size: 24px; font-weight: 900; color: #000; letter-spacing: 2px;">${trackingNumber}</div>
         </div>
         
         <div class="divider"></div>
         
         <div class="text-small" style="margin-bottom: 10px; color: #666;">Shipment Content</div>
         <table role="presentation">
             ${order.orderItems.map(item => `
               <tr>
                  <td style="padding: 5px 0;">
                     <div class="text-bold" style="font-size: 13px;">${item.name}</div>
                     <div class="text-small">Size: ${item.size} | Qty: ${item.qty}</div>
                  </td>
               </tr>
             `).join('')}
         </table>
      </div>

      <div class="text-center">
         <a href="https://www.fdedomestic.com/track.php?track_number=${trackingNumber}" class="btn">Track Shipment</a>
      </div>
   `;

   return baseTemplate(content, `Shipment Dispatched #${orderIdShort}`, `Your tracking number is now available.`);
};

exports.adminOrderNotificationTemplate = (order) => {
   return exports.orderConfirmationTemplate(order, { name: 'Admin' }, true);
};

exports.paymentSuccessTemplate = (order, is_admin = false) => {
   if (!is_admin) {
      return exports.orderConfirmationTemplate(order, { name: order.shippingAddress.firstName });
   }
   return exports.adminOrderNotificationTemplate(order);
};
