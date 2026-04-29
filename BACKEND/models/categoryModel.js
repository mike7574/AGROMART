const pool = require('../config/database');

async function getCategoryByName(name, connection = null) {
  const query = 'SELECT * FROM categories WHERE name = ? LIMIT 1';
  const db = connection || (await pool.getConnection());
  try {
    const [categories] = await db.query(query, [name]);
    return categories.length > 0 ? categories[0] : null;
  } finally {
    if (!connection) db.release();
  }
}

async function createCategory(name, connection = null) {
  const query = 'INSERT INTO categories (name, slug, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
  const slug = String(name || 'category').trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9\-]+/g, '').replace(/\-+/g, '-').replace(/^-+|-+$/g, '');
  const db = connection || (await pool.getConnection());
  try {
    const [result] = await db.query(query, [name, slug]);
    return result.insertId;
  } finally {
    if (!connection) db.release();
  }
}

async function getOrCreateCategoryByName(name, connection = null) {
  const normalized = String(name || 'Uncategorized').trim();
  let category = await getCategoryByName(normalized, connection);
  if (category) return category.id;
  return await createCategory(normalized, connection);
}

module.exports = {
  getCategoryByName,
  createCategory,
  getOrCreateCategoryByName
};
