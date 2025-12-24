const prisma = require('../lib/prisma');

// @desc    Generate XML sitemap for SEO
// @route   GET /api/sitemap.xml
// @access  Public
exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Generate XML sitemap
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

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating sitemap',
      error: error.message 
    });
  }
};

// @desc    Generate robots.txt for SEO
// @route   GET /robots.txt
// @access  Public
exports.generateRobotsTxt = async (req, res) => {
  try {
    const baseUrl = process.env.API_URL || 'https://backend-node-lilac-seven.vercel.app';
    
    let txt = 'User-agent: *\n';
    txt += 'Allow: /\n';
    txt += 'Disallow: /api/auth/\n';
    txt += 'Disallow: /api/admin/\n\n';
    txt += `Sitemap: ${baseUrl}/api/sitemap.xml\n`;

    res.header('Content-Type', 'text/plain');
    res.status(200).send(txt);
  } catch (error) {
    console.error('Robots.txt generation error:', error);
    res.status(500).send('User-agent: *\nAllow: /');
  }
};
