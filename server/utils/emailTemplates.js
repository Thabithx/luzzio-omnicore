/**
 * Luzzio Architectural Email Templates
 * Minimalist monochrome design following the corporate visual identity.
 */

exports.orderConfirmationTemplate = (order, user) => {
   const itemsHtml = order.orderItems.map(item => `
      <tr style="border-bottom: 1px solid #000;">
         <td style="padding: 20px 0; font-family: 'Helvetica', sans-serif; font-size: 10px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px;">
            ${item.name} <br/>
            <span style="color: #999; font-weight: 400;">SIZE: ${item.size}</span>
         </td>
         <td style="padding: 20px 0; text-align: right; font-family: 'Helvetica', sans-serif; font-size: 10px; font-weight: 900;">
            ${item.qty} X $${item.price}.00
         </td>
      </tr>
   `).join('');

   return `
   <!DOCTYPE html>
   <html>
   <head>
      <meta charset="utf-8">
      <title>Luzzio Archive Dispatch</title>
   </head>
   <body style="margin: 0; padding: 0; background-color: #ffffff; color: #000000; font-family: 'Helvetica', sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
         <tr>
            <td align="center" style="padding: 40px 0;">
               <table width="600" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #000000; padding: 40px;">
                  <tr>
                     <td align="center" style="padding-bottom: 40px; border-bottom: 1px solid #000;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 10px;">LUZZIO</h1>
                        <p style="margin: 10px 0 0; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; color: #999;">Archive Confirmation</p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 40px 0;">
                        <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Protocol: Order Recorded</p>
                        <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #666; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">
                           Hello ${user.name}, your selection has been officially registered in the Luzzio digital archive. Our logistics team is now preparing your items for priority dispatch.
                        </p>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #000;">
                           <thead>
                              <tr>
                                 <th align="left" style="padding: 20px 0; font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #999;">Item Selection</th>
                                 <th align="right" style="padding: 20px 0; font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #999;">Price Protocol</th>
                              </tr>
                           </thead>
                           <tbody style="border-top: 1px solid #000;">
                              ${itemsHtml}
                           </tbody>
                           <tfoot>
                              <tr>
                                 <td style="padding: 20px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Total Selection Value</td>
                                 <td align="right" style="padding: 20px 0; font-size: 14px; font-weight: 900;">$${order.totalPrice}.00</td>
                              </tr>
                           </tfoot>
                        </table>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 40px 0; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                        <h4 style="margin: 0 0 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Logistics Hub</h4>
                        <p style="margin: 0; font-size: 10px; color: #666; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; line-height: 1.6;">
                           ${order.shippingAddress.address}<br/>
                           ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}
                        </p>
                     </td>
                  </tr>
                  <tr>
                     <td align="center" style="padding-top: 40px;">
                        <p style="margin: 0; font-size: 8px; color: #999; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">© 2025 Luzzio | Corporate Excellence</p>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
   </html>
   `;
};

exports.trackingUpdateTemplate = (order, item, trackingNumber, user) => {
   return `
   <!DOCTYPE html>
   <html>
   <head>
      <meta charset="utf-8">
      <title>Luzzio Logistics Update</title>
   </head>
   <body style="margin: 0; padding: 0; background-color: #ffffff; color: #000000; font-family: 'Helvetica', sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
         <tr>
            <td align="center" style="padding: 40px 0;">
               <table width="600" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #000000; padding: 40px;">
                  <tr>
                     <td align="center" style="padding-bottom: 40px; border-bottom: 1px solid #000;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 10px;">LUZZIO</h1>
                        <p style="margin: 10px 0 0; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; color: #999;">Logistics Update</p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 40px 0;">
                        <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Protocol: Shipment Dispatched</p>
                        <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #666; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">
                           Hello ${user.name}, a logistics tracking sequence has been registered for an item in your selection.
                        </p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 30px; background-color: #f6f6f6; border: 1px solid #000;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                           <tr>
                              <td style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Item</td>
                              <td style="text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Tracking Protocol</td>
                           </tr>
                           <tr>
                              <td style="padding-top: 15px; font-size: 12px; font-weight: 900; text-transform: uppercase;">${item.name}</td>
                              <td style="padding-top: 15px; text-align: right; font-size: 12px; font-weight: 900; color: #000;">${trackingNumber}</td>
                           </tr>
                        </table>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 40px 0;">
                        <p style="font-size: 10px; line-height: 1.6; color: #666; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">
                           You can monitor this shipment via our carrier's portal using the provided tracking sequence. Thank you for your continued engagement with Luzzio.
                        </p>
                        <div style="margin-top: 30px;">
                           <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">View Order Registry</a>
                        </div>
                     </td>
                  </tr>
                  <tr>
                     <td align="center" style="padding-top: 40px; border-top: 1px solid #000;">
                        <p style="margin: 0; font-size: 8px; color: #999; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">© 2025 Luzzio | Corporate Excellence</p>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
   </html>
   `;
};

exports.adminOrderNotificationTemplate = (order) => {
   const itemsHtml = order.orderItems.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
         <td style="padding: 12px 0; font-family: 'Helvetica', sans-serif; font-size: 11px; text-transform: uppercase; font-weight: 700;">
            ${item.name} (${item.size})
         </td>
         <td style="padding: 12px 0; text-align: right; font-family: 'Helvetica', sans-serif; font-size: 11px; font-weight: 700;">
            ${item.qty} UNITS
         </td>
      </tr>
   `).join('');

   return `
   <!DOCTYPE html>
   <html>
   <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: 'Helvetica', sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
         <tr>
            <td align="center" style="padding: 40px 0;">
               <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #000; padding: 40px;">
                  <tr>
                     <td style="padding-bottom: 20px; border-bottom: 2px solid #000;">
                        <h1 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 5px;">LUZZIO: NEW ORDER</h1>
                        <p style="margin: 5px 0 0; font-size: 9px; font-weight: 900; color: #f00;">PROTOCOL: ACTION REQUIRED</p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 30px 0;">
                        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Order UUID: ${order._id}</p>
                        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Client: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName} (${order.email})</p>
                        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Value: LKR ${order.totalPrice.toLocaleString()}.00</p>
                        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Method: ${order.paymentMethod}</p>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #000;">
                           ${itemsHtml}
                        </table>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding-top: 30px;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/orders" style="display: block; width: 100%; text-align: center; padding: 15px 0; background-color: #000; color: #fff; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Process in Admin Panel</a>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
   </html>
   `;
};

exports.paymentSuccessTemplate = (order, is_admin = false) => {
   return `
   <!DOCTYPE html>
   <html>
   <body style="margin: 0; padding: 0; background-color: #ffffff; color: #000000; font-family: 'Helvetica', sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
         <tr>
            <td align="center" style="padding: 40px 0;">
               <table width="600" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #000000; padding: 40px;">
                  <tr>
                     <td align="center" style="padding-bottom: 40px; border-bottom: 1px solid #000;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 10px;">LUZZIO</h1>
                        <p style="margin: 10px 0 0; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; color: #008000;">Payment Verified</p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 40px 0;">
                        <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Protocol: Settlement Complete</p>
                        <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #000; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">
                           ${is_admin
         ? `Payment of LKR ${order.totalPrice.toLocaleString()}.00 for Order #${order._id.toString().slice(-6).toUpperCase()} has been successfully processed.`
         : `Hello ${order.shippingAddress.firstName}, your payment of LKR ${order.totalPrice.toLocaleString()}.00 has been verified. Your order is now moving to the fulfillment stage.`
      }
                        </p>
                     </td>
                  </tr>
                  <tr>
                     <td align="center" style="padding-top: 40px; border-top: 1px solid #000;">
                        <p style="margin: 0; font-size: 8px; color: #999; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">© 2025 Luzzio | Settlement Protocol</p>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
   </html>
   `;
};
