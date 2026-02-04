/**
 * Sitemap Service
 * Generates sitemap.xml and robots.txt for SEO
 */

const productDao = require('../dao/product.dao');

/**
 * Generate Sitemap XML
 * @returns {string} xml content
 */
const generateSitemap = async () => {
  const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
  
  // Get all active products (slug and updatedAt)
  // We use the new 'find' method in productDao without default pagination/limit
  const products = await productDao.find(
    { isActive: true },
    'slug updatedAt',
    { updatedAt: -1 }
  );

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Products
  products.forEach(product => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
    xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
};

/**
 * Generate Robots.txt
 * @returns {string} txt content
 */
const generateRobotsTxt = () => {
  const baseUrl = process.env.API_URL || 'https://api.yourdomain.com';
  
  let txt = 'User-agent: *\n';
  txt += 'Allow: /\n';
  txt += 'Disallow: /api/auth/\n';
  txt += 'Disallow: /api/admin/\n\n';
  txt += `Sitemap: ${baseUrl}/api/sitemap.xml\n`;

  return txt;
};

module.exports = {
  generateSitemap,
  generateRobotsTxt
};
