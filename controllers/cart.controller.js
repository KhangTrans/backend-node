const cartService = require('../services/cart.service');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Service handles all business logic
    const result = await cartService.getUserCart(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy giỏ hàng',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Service handles validation and business logic
    const addedItem = await cartService.addItemToCart(userId, productId, quantity);

    res.status(201).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: addedItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    
    // Determine appropriate status code based on error
    const statusCode = error.message.includes('không tồn tại') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Service handles validation and business logic
    const updatedItem = await cartService.updateCartItemQuantity(userId, itemId, quantity);

    res.json({
      success: true,
      message: 'Đã cập nhật giỏ hàng',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    
    // Determine appropriate status code based on error
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Service handles business logic
    await cartService.removeItemFromCart(userId, itemId);

    res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Service handles business logic
    await cartService.clearUserCart(userId);

    res.json({
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
