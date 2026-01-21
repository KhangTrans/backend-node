const Cart = require('../models/Cart.model');

/**
 * Cart DAO - Data Access Object layer
 * Handles all database operations related to cart
 */

// Find cart by userId
const findByUserId = async (userId) => {
  return await Cart.findOne({ userId });
};

// Find cart by userId with populated products
const findByUserIdWithProducts = async (userId) => {
  return await Cart.findOne({ userId })
    .populate('items.productId');
};

// Create new cart
const create = async (cartData) => {
  return await Cart.create(cartData);
};

// Get or create cart for user
const getOrCreate = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

// Save cart
const save = async (cart) => {
  return await cart.save();
};

// Clear cart items
const clearItems = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return cart;
};

// Find cart item by product ID
const findCartItemByProductId = (cart, productId) => {
  return cart.items.findIndex(
    item => item.productId.toString() === productId
  );
};

// Add item to cart
const addItem = async (cart, itemData) => {
  cart.items.push(itemData);
  return await cart.save();
};

// Remove item from cart
const removeItem = async (cart, itemId) => {
  cart.items.pull(itemId);
  return await cart.save();
};

// Update cart item
const updateCartItem = async (cart, itemId, updateData) => {
  const cartItem = cart.items.id(itemId);
  if (cartItem) {
    Object.assign(cartItem, updateData);
    await cart.save();
  }
  return cartItem;
};

// Get cart item by ID
const getCartItemById = (cart, itemId) => {
  return cart.items.id(itemId);
};

module.exports = {
  findByUserId,
  findByUserIdWithProducts,
  create,
  getOrCreate,
  save,
  clearItems,
  findCartItemByProductId,
  addItem,
  removeItem,
  updateCartItem,
  getCartItemById
};
