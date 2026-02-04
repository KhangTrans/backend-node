const userService = require('../services/user.service');

// @desc    Get all users with filtering and search
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const result = await userService.getUsers(req.query);
    
    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      data: result.users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    const status = error.message === 'User not found' ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Error getting user',
      error: error.message
    });
  }
};

// @desc    Create new user (Admin)
// @route   POST /api/users
// @access  Admin
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    const status = error.message === 'Username or email already exists' ? 400 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    let status = 500;
    if (error.message === 'User not found') status = 404;
    if (error.message === 'Email already in use' || error.message === 'Username already in use') status = 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    const status = error.message === 'User not found' ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Error deleting user',
      error: error.message
    });
  }
};
