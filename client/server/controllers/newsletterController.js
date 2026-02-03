const Newsletter = require('../models/Newsletter');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
   try {
      const { email } = req.body;

      if (!email) {
         return res.status(400).json({ message: 'Email is required' });
      }

      // Check if email already exists
      const existingSubscriber = await Newsletter.findOne({ email });
      if (existingSubscriber) {
         if (existingSubscriber.isActive) {
            return res.status(400).json({ message: 'Email already subscribed' });
         } else {
            // Reactivate subscription
            existingSubscriber.isActive = true;
            existingSubscriber.subscribedAt = Date.now();
            await existingSubscriber.save();
            return res.status(200).json({ message: 'Subscription reactivated successfully' });
         }
      }

      // Create new subscription
      const newSubscriber = new Newsletter({ email });
      await newSubscriber.save();

      res.status(201).json({
         message: 'Successfully subscribed to newsletter',
         subscriber: { email: newSubscriber.email }
      });
   } catch (error) {
      console.error('Newsletter subscription error:', error);
      res.status(500).json({ message: 'Failed to subscribe', error: error.message });
   }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
   try {
      const { email } = req.body;

      const subscriber = await Newsletter.findOne({ email });
      if (!subscriber) {
         return res.status(404).json({ message: 'Email not found' });
      }

      subscriber.isActive = false;
      await subscriber.save();

      res.status(200).json({ message: 'Successfully unsubscribed' });
   } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
   }
};

// Get all subscribers (admin only)
exports.getAllSubscribers = async (req, res) => {
   try {
      const subscribers = await Newsletter.find({ isActive: true })
         .sort({ subscribedAt: -1 });

      res.status(200).json({
         count: subscribers.length,
         subscribers
      });
   } catch (error) {
      console.error('Get subscribers error:', error);
      res.status(500).json({ message: 'Failed to fetch subscribers', error: error.message });
   }
};
