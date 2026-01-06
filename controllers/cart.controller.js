const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId })
      .populate('items.productId');

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: []
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        cart,
        summary: {
          itemCount: cart.items.length,
          totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: subtotal.toFixed(2)
        }
      }
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

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp productId'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không còn khả dụng'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stock} sản phẩm trong kho`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    let updatedCart;
    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${product.stock} sản phẩm trong kho`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
      await cart.save();

      updatedCart = await Cart.findOne({ userId })
        .populate('items.productId');
    } else {
      // Create new cart item
      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.price
      });
      await cart.save();

      updatedCart = await Cart.findOne({ userId })
        .populate('items.productId');
    }

    // Get the added item
    const addedItem = updatedCart.items.find(
      item => item.productId._id.toString() === productId
    );

    res.status(201).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: addedItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm vào giỏ hàng',
      error: error.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Find cart item
    const cartItem = cart.items.id(itemId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    // Get product to check stock
    const product = await Product.findById(cartItem.product);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stock} sản phẩm trong kho`
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    cartItem.price = product.price;
    await cart.save();

    // Populate and return
    const updatedCart = await Cart.findOne({ userId })
      .populate('items.productId');

    const updatedItem = updatedCart.items.id(itemId);

    res.json({
      success: true,
      message: 'Đã cập nhật giỏ hàng',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật giỏ hàng',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Remove cart item
    cart.items.pull(itemId);
    await cart.save();

    res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
      error: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Delete all cart items
    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa giỏ hàng',
      error: error.message
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
