const mongoose = require('mongoose');
const Order = require('./models/Order.model');
require('dotenv').config();

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find({}, 'paymentMethod orderStatus');
    console.log('Total orders:', orders.length);
    
    // Group by paymentMethod
    const paymentMethods = {};
    orders.forEach(order => {
      paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
    });
    
    console.log('Payment Methods distribution:', paymentMethods);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkOrders();
