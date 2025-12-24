/**
 * Generate URL-friendly slug from Vietnamese text
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
function generateSlug(text) {
  if (!text) return '';

  // Convert to lowercase
  let slug = text.toLowerCase();

  // Replace Vietnamese characters
  const vietnameseMap = {
    'à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ': 'a',
    'è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ': 'e',
    'ì|í|ị|ỉ|ĩ': 'i',
    'ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ': 'o',
    'ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ': 'u',
    'ỳ|ý|ỵ|ỷ|ỹ': 'y',
    'đ': 'd',
    'À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ': 'a',
    'È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ': 'e',
    'Ì|Í|Ị|Ỉ|Ĩ': 'i',
    'Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ': 'o',
    'Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ': 'u',
    'Ỳ|Ý|Ỵ|Ỷ|Ỹ': 'y',
    'Đ': 'd'
  };

  // Replace Vietnamese characters
  for (const [pattern, replacement] of Object.entries(vietnameseMap)) {
    slug = slug.replace(new RegExp(pattern, 'g'), replacement);
  }

  // Remove special characters, keep only letters, numbers, spaces, and hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Replace multiple spaces or hyphens with single hyphen
  slug = slug.replace(/[\s-]+/g, '-');

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Generate unique slug with counter if needed
 * @param {string} text - Text to convert to slug
 * @param {number} id - Product ID to exclude from check
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(text, id = null, prisma) {
  let slug = generateSlug(text);
  let counter = 1;
  let uniqueSlug = slug;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: uniqueSlug,
        id: id ? { not: id } : undefined
      }
    });

    if (!existing) {
      break;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

module.exports = {
  generateSlug,
  generateUniqueSlug
};
