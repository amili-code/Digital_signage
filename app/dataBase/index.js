const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.HOST, // آدرس سرور دیتابیس
    user: 'root', // نام کاربری
    password: '', // رمز عبور
    database: 'digital_sign', // نام دیتابیس
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
