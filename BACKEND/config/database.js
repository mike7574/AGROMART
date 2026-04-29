const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✓ MySQL Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Database connection error:', err.message);
    process.exit(1);
  });

module.exports = pool;
