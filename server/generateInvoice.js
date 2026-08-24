const fs = require('fs');
const path = require('path');
const { orderConfirmationTemplate } = require('./utils/emailTemplates');

const mockOrder = {
   _id: 'mock_order_123456789',
   createdAt: new Date(),
   shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Test Street',
      city: 'Colombo',
      phone: '0771234567'
   },
   orderItems: [
      {
         name: 'Premium T-Shirt',
         size: 'L',
         qty: 2,
         price: 2500,
         image: 'https://via.placeholder.com/60'
      },
      {
         name: 'Denim Jeans',
         size: '32',
         qty: 1,
         price: 4500,
         image: 'https://via.placeholder.com/60'
      }
   ],
   itemsPrice: 9500,
   shippingPrice: 390,
   totalPrice: 9890,
   paymentMethod: 'Cash on Delivery'
};

const mockUser = {
   name: 'John Doe'
};

const html = orderConfirmationTemplate(mockOrder, mockUser, false);
const outputPath = path.join(__dirname, '../client/public/invoice-preview.html');

fs.writeFileSync(outputPath, html);
console.log('Invoice preview generated at client/public/invoice-preview.html');
