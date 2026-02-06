const reviewDao = require('../dao/review.dao');
const notificationService = require('./notification.service');
const userDao = require('../dao/user.dao');
const orderDao = require('../dao/order.dao');

const addReview = async (userId, productId, rating, comment) => {
  // Check if user purchased this product
  const hasPurchased = await orderDao.hasPurchasedProduct(userId, productId);
  if (!hasPurchased) {
    throw new Error('Bạn cần mua và nhận sản phẩm này thành công mới có thể đánh giá.');
  }

  // Check if user already reviewed
  const existingReview = await reviewDao.findByUserAndProduct(userId, productId);
  if (existingReview) {
    throw new Error('Bạn đã đánh giá sản phẩm này rồi');
  }

  const review = await reviewDao.create({
    user: userId,
    product: productId,
    rating: Number(rating),
    comment
  });

  // Notify Admins
  try {
    const admins = await userDao.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await notificationService.sendNotification(
        admin._id,
        'Đánh giá mới',
        `Có đánh giá ${rating} sao mới cho sản phẩm.`,
        'REVIEW_CREATED',
        `/admin/reviews`
      );
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }

  return review;
};

const replyToReview = async (reviewId, adminId, comment) => {
  const review = await reviewDao.findById(reviewId);
  if (!review) throw new Error('Không tìm thấy đánh giá');

  const updatedReview = await reviewDao.updateById(reviewId, {
    reply: {
      comment,
      repliedAt: new Date(),
      repliedBy: adminId
    }
  });

  // Notify User
  try {
    await notificationService.sendNotification(
      review.user._id || review.user, // handle populated or ID
      'Phản hồi từ Admin',
      'Admin đã trả lời đánh giá sản phẩm của bạn.',
      'REVIEW_REPLY',
      `/products/${review.product}`
    );
  } catch (err) {
    console.error('Failed to notify user:', err);
  }

  return updatedReview;
};

const getReviewsByProduct = async (productId) => {
  return await reviewDao.findByProduct(productId);
};

const getReviewStats = async (productId) => {
  const stats = await reviewDao.getStatsByProduct(productId);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const s = stats[0];
  return {
    averageRating: Math.round(s.averageRating * 10) / 10,
    totalReviews: s.totalReviews,
    distribution: {
      5: s.count5,
      4: s.count4,
      3: s.count3,
      2: s.count2,
      1: s.count1
    }
  };
};



const getAllReviews = async ({ page = 1, limit = 20, rating, isReplied }) => {
  const filter = {};
  if (rating) filter.rating = parseInt(rating);
  
  // Check reply existence
  if (isReplied === 'true') filter['reply.comment'] = { $exists: true, $ne: null };
  if (isReplied === 'false') filter['reply.comment'] = { $exists: false };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [reviews, total] = await Promise.all([
    reviewDao.findAll(filter, skip, parseInt(limit)),
    reviewDao.count(filter)
  ]);

  return {
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const deleteReview = async (reviewId) => {
  return await reviewDao.deleteById(reviewId);
};

module.exports = {
  addReview,
  replyToReview,
  getReviewsByProduct,
  getReviewStats,
  getAllReviews,
  deleteReview
};
