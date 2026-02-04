const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');

/**
 * Cart Service - Business Logic Layer
 * Handles business logic for shopping cart operations
 */

/**
 * Get user's cart with calculated totals
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Cart with summary
 */
const getUserCart = async (userId) => {
  let cart = await cartDao.findByUserIdWithProducts(userId);

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await cartDao.create({
      userId,
      items: []
    });
  }

  // Business logic: Calculate totals
  const summary = calculateCartSummary(cart);

  return {
    cart,
    summary
  };
};

/**
 * Add item to cart with validation
 * @param {String} userId - User ID
 * @param {String} productId - Product ID
 * @param {Number} quantity - Quantity to add
 * @returns {Promise<Object>} Added cart item
 */
const addItemToCart = async (userId, productId, quantity = 1) => {
  // Business logic: Validate input
  if (!productId) {
    throw new Error('Vui lòng cung cấp productId');
  }

  if (quantity < 1) {
    throw new Error('Số lượng phải lớn hơn 0');
  }

  // Check if product exists and is active
  const product = await productDao.findById(productId, false);

  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  if (!product.isActive) {
    throw new Error('Sản phẩm không còn khả dụng');
  }

  // Business logic: Check stock availability
  if (product.stock < quantity) {
    throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }

  // Get or create cart
  let cart = await cartDao.getOrCreate(userId);

  // Check if item already exists in cart
  const existingItemIndex = cartDao.findCartItemByProductId(cart, productId);

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Business logic: Validate total quantity against stock
    if (product.stock < newQuantity) {
      throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
    await cartDao.save(cart);
  } else {
    // Add new item
    cart.items.push({
      productId: productId,
      quantity: quantity,
      price: product.price
    });
    await cartDao.save(cart);
  }

  // Get updated cart with populated products
  const updatedCart = await cartDao.findByUserIdWithProducts(userId);
  
  // Find the added/updated item
  const addedItem = updatedCart.items.find(
    item => item.productId._id.toString() === productId
  );

  return addedItem;
};

/**
 * Update cart item quantity with validation
 * @param {String} userId - User ID
 * @param {String} itemId - Cart item ID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart item
 */
const updateCartItemQuantity = async (userId, itemId, quantity) => {
  // Business logic: Validate quantity
  if (!quantity || quantity < 1) {
    throw new Error('Số lượng phải lớn hơn 0');
  }

  // Find cart
  const cart = await cartDao.findByUserId(userId);

  if (!cart) {
    throw new Error('Không tìm thấy giỏ hàng');
  }

  // Find cart item
  const cartItem = cartDao.getCartItemById(cart, itemId);

  if (!cartItem) {
    throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
  }

  // Get product to check stock
  const product = await productDao.findById(cartItem.productId, false);

  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  // Business logic: Check stock availability
  if (product.stock < quantity) {
    throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
  }

  // Update quantity and price
  cartItem.quantity = quantity;
  cartItem.price = product.price; // Update price in case it changed
  await cartDao.save(cart);

  // Get updated cart with populated products
  const updatedCart = await cartDao.findByUserIdWithProducts(userId);
  const updatedItem = updatedCart.items.id(itemId);

  return updatedItem;
};

/**
 * Remove item from cart
 * @param {String} userId - User ID
 * @param {String} itemId - Cart item ID
 * @returns {Promise<void>}
 */
const removeItemFromCart = async (userId, itemId) => {
  const cart = await cartDao.findByUserId(userId);

  if (!cart) {
    throw new Error('Không tìm thấy giỏ hàng');
  }

  // Check if item exists
  const cartItem = cartDao.getCartItemById(cart, itemId);
  
  if (!cartItem) {
    throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
  }

  await cartDao.removeItem(cart, itemId);
};

/**
 * Clear all items from cart
 * @param {String} userId - User ID
 * @returns {Promise<void>}
 */
const clearUserCart = async (userId) => {
  const cart = await cartDao.findByUserId(userId);

  if (!cart) {
    throw new Error('Không tìm thấy giỏ hàng');
  }

  await cartDao.clearItems(userId);
};

/**
 * Validate cart before checkout
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Validation result with cart and issues
 */
const validateCartForCheckout = async (userId) => {
  const cart = await cartDao.findByUserIdWithProducts(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error('Giỏ hàng trống');
  }

  const issues = [];
  const validItems = [];

  // Business logic: Validate each item
  for (const item of cart.items) {
    const product = await productDao.findById(item.productId._id, false);

    if (!product) {
      issues.push({
        itemId: item._id,
        productName: item.productId.name,
        issue: 'Sản phẩm không tồn tại'
      });
      continue;
    }

    if (!product.isActive) {
      issues.push({
        itemId: item._id,
        productName: product.name,
        issue: 'Sản phẩm không còn khả dụng'
      });
      continue;
    }

    if (product.stock < item.quantity) {
      issues.push({
        itemId: item._id,
        productName: product.name,
        issue: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        availableStock: product.stock
      });
      continue;
    }

    validItems.push(item);
  }

  return {
    cart,
    isValid: issues.length === 0,
    issues,
    validItems,
    summary: calculateCartSummary({ items: validItems })
  };
};

/**
 * Calculate cart summary (helper function)
 * @param {Object} cart - Cart object
 * @returns {Object} Summary with totals
 */
const calculateCartSummary = (cart) => {
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.productId?.price || item.price || 0;
    return sum + (parseFloat(price) * item.quantity);
  }, 0);

  return {
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: parseFloat(subtotal.toFixed(2))
  };
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearUserCart,
  validateCartForCheckout,
  calculateCartSummary
};
