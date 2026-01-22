const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);
// Restrict to Admin
router.use(authorize('admin'));

// Route: /api/users
router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

// Route: /api/users/:id
router.route('/:id')
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
