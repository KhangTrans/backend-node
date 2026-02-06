const Review = require('../models/Review.model');
const mongoose = require('mongoose');

const create = async (reviewData) => {
  const review = await Review.create(reviewData);
  return await review.populate('user', 'username fullName avatar');
};

const findByUserAndProduct = async (userId, productId) => {
  return await Review.findOne({ user: userId, product: productId });
};

const findByProduct = async (productId) => {
  return await Review.find({ product: productId })
    .populate('user', 'username fullName avatar')
    .sort({ createdAt: -1 });
};

const getStatsByProduct = async (productId) => {
  const objectId = new mongoose.Types.ObjectId(productId);
  return await Review.aggregate([
    { $match: { product: objectId } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      }
    }
  ]);
};

const findById = async (id) => {
  return await Review.findById(id).populate('user', 'username fullName avatar').populate('product', 'name slug images');
};

const updateById = async (id, updateData) => {
  return await Review.findByIdAndUpdate(id, updateData, { new: true }).populate('user', 'username fullName avatar');
};

const findAll = async (filter, skip, limit) => {
  return await Review.find(filter)
    .populate('user', 'username fullName avatar')
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const count = async (filter) => {
  return await Review.countDocuments(filter);
};

const deleteById = async (id) => {
  return await Review.findByIdAndDelete(id);
};

module.exports = {
  create,
  findByUserAndProduct,
  findByProduct,
  getStatsByProduct,
  findById,
  updateById,
  findAll,
  count,
  deleteById
};
