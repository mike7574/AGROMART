const pool = require('../config/database');
const categoryModel = require('./categoryModel');

// ========================================
// PRODUCT QUERIES
// ========================================

function parseProductRows(products) {
  return products.map(p => ({
    ...p,
    images: p.images ? p.images.split(',') : []
  }));
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]+/g, '')
    .replace(/\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get all active products with images
async function getAllProducts() {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = TRUE
      GROUP BY p.id
      ORDER BY p.sort_order ASC
    `;
    const [products] = await connection.query(query);
    connection.release();
    
    return parseProductRows(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Get product by ID with images
async function getProductById(productId) {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = ? AND p.is_active = TRUE
      GROUP BY p.id
    `;
    const [products] = await connection.query(query, [productId]);
    connection.release();
    
    if (products.length === 0) return null;
    
    return {
      ...products[0],
      images: products[0].images ? products[0].images.split(',') : []
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// Get products by category
async function getProductsByCategory(categoryName) {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = TRUE AND c.name = ?
      GROUP BY p.id
      ORDER BY p.sort_order ASC
    `;
    const [products] = await connection.query(query, [categoryName]);
    connection.release();
    
    return parseProductRows(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

// Search products
async function searchProducts(query) {
  try {
    const connection = await pool.getConnection();
    const searchQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = TRUE AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        c.name LIKE ?
      )
      GROUP BY p.id
      ORDER BY p.sort_order ASC
    `;
    const searchTerm = `%${query}%`;
    const [products] = await connection.query(searchQuery, [searchTerm, searchTerm, searchTerm]);
    connection.release();
    
    return parseProductRows(products);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

async function createProduct(productData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const categoryId = await categoryModel.getOrCreateCategoryByName(productData.category || 'Uncategorized', connection);
    const slug = productData.slug ? String(productData.slug).trim() : slugify(productData.name || 'product');
    const query = `
      INSERT INTO products
        (category_id, sku, name, slug, description, unit, current_price, original_price, stock, is_active, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      categoryId,
      productData.sku || null,
      productData.name || 'Untitled Product',
      slug,
      productData.description || null,
      productData.unit || 'each',
      productData.currentPrice != null ? productData.currentPrice : 0,
      productData.originalPrice != null ? productData.originalPrice : null,
      productData.stock != null ? productData.stock : 0,
      productData.active !== false ? 1 : 0,
      productData.sortOrder != null ? productData.sortOrder : 100
    ];
    const [result] = await connection.query(query, values);
    const productId = result.insertId;

    if (Array.isArray(productData.images) && productData.images.length) {
      const imageQuery = `
        INSERT INTO product_images (product_id, image_url, sort_order, is_primary, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      await Promise.all(productData.images.map((imageUrl, index) =>
        connection.query(imageQuery, [productId, imageUrl, index, index === 0 ? 1 : 0])
      ));
    }

    await connection.commit();
    return productId;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function updateProduct(productId, productData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const fields = [];
    const values = [];

    if (productData.name) {
      fields.push('name = ?');
      values.push(productData.name);
      fields.push('slug = ?');
      values.push(productData.slug ? String(productData.slug).trim() : slugify(productData.name));
    }
    if (productData.sku !== undefined) {
      fields.push('sku = ?');
      values.push(productData.sku || null);
    }
    if (productData.description !== undefined) {
      fields.push('description = ?');
      values.push(productData.description || null);
    }
    if (productData.unit !== undefined) {
      fields.push('unit = ?');
      values.push(productData.unit || 'each');
    }
    if (productData.currentPrice !== undefined) {
      fields.push('current_price = ?');
      values.push(productData.currentPrice);
    }
    if (productData.originalPrice !== undefined) {
      fields.push('original_price = ?');
      values.push(productData.originalPrice);
    }
    if (productData.stock !== undefined) {
      fields.push('stock = ?');
      values.push(productData.stock);
    }
    if (productData.active !== undefined) {
      fields.push('is_active = ?');
      values.push(productData.active ? 1 : 0);
    }
    if (productData.sortOrder !== undefined) {
      fields.push('sort_order = ?');
      values.push(productData.sortOrder);
    }

    if (productData.category) {
      const categoryId = await categoryModel.getOrCreateCategoryByName(productData.category, connection);
      fields.push('category_id = ?');
      values.push(categoryId);
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      const updateQuery = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      values.push(productId);
      await connection.query(updateQuery, values);
    }

    if (Array.isArray(productData.images)) {
      await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      const imageQuery = `
        INSERT INTO product_images (product_id, image_url, sort_order, is_primary, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      await Promise.all(productData.images.map((imageUrl, index) =>
        connection.query(imageQuery, [productId, imageUrl, index, index === 0 ? 1 : 0])
      ));
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error updating product:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function softDeleteProduct(productId) {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE products SET is_active = 0, deleted_at = NOW(), updated_at = NOW() WHERE id = ?';
    await connection.query(query, [productId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error soft deleting product:', error);
    throw error;
  }
}

// Update product stock
async function updateProductStock(productId, newStock) {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE products SET stock = ? WHERE id = ?';
    await connection.query(query, [newStock, productId]);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  updateProductStock
};
