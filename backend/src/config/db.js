const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'amhara_jobs_portal',
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           '+03:00',
});

async function connectDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database is connected');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

module.exports = pool;
module.exports.connectDatabase = connectDatabase;
