const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemap.controller');

// Routes
router.get('/sitemap.xml', sitemapController.generateSitemap);
router.get('/robots.txt', sitemapController.generateRobotsTxt);

module.exports = router;
