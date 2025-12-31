const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
   try {
      const orders = await Order.find({});
      const userCount = await User.countDocuments({ role: 'user' });
      const productCount = await Product.countDocuments({});

      // Gross Revenue
      const grossRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

      // Inventory Outflow (Total items sold across all orders)
      const inventoryOutflow = orders.reduce((acc, order) => {
         return acc + order.orderItems.reduce((itemAcc, item) => itemAcc + item.qty, 0);
      }, 0);

      // Archive Momentum (Orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrdersCount = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      // Recent Orders for the table
      const recentOrders = await Order.find({})
         .populate('user', 'name email')
         .sort('-createdAt')
         .limit(5);

      res.status(200).json({
         success: true,
         data: {
            grossRevenue,
            inventoryOutflow,
            clientRegistry: userCount,
            archiveMomentum: recentOrdersCount,
            recentOrders
         }
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};
