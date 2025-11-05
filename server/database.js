import mysql from "mysql2/promise";

let pool = null;

export async function initDatabase() {
    try {
        pool = mysql.createPool({host: process.env.DB_HOST || "localhost", port: process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0});
        const connection = await pool.getConnection();
        console.log("✅ Connected to MySQL (Reviews Database)");
        connection.release();
        return pool;
    } catch (error) {
        return null;
    }
}

/**
 * Get reviews by product name
 * @param {string} productName - Product name
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByProductName(productName) {
    if (!pool) {
        return [];
    }
    try {
        const [rows] = await pool.query(
            `SELECT 
                id,
                user_username,
                user_avatar,
                product_name,
                review_description,
                rating,
                created_at
            FROM reviews 
            WHERE product_name = ? 
            ORDER BY created_at DESC`,
            [productName]
        );
        return rows;
    } catch (error) {
        return [];
    }
}

/**
 * Get review statistics for a product
 * @param {string} productName - Product name
 * @returns {Promise<object>} Statistics
 */
export async function getProductReviewStats(productName) {
    if (!pool) {
        return {total: 0, averageRating: 0};
    }
    try {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                AVG(rating) as averageRating
            FROM reviews 
            WHERE product_name = ?`,
            [productName]
        );
        return {
            total: rows[0].total || 0,
            averageRating: parseFloat(rows[0].averageRating || 0).toFixed(1)
        };
    } catch (error) {
        return { total: 0, averageRating: 0 };
    }
}

export async function closeDatabase() {
    if (pool) {
        await pool.end();
    }
}