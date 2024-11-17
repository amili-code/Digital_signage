const pool = require('./index')

async function performCRUD(action, table, condition = {}, data = {}) {
    try {
        // دریافت ستون‌های جدول به‌صورت پویا
        const [columnsResult] = await pool.query(`SHOW COLUMNS FROM ${table}`);
        const columns = columnsResult.map((col) => col.Field);

        // انتخاب نوع عملیات
        switch (action.toLowerCase()) {
            case 'add': {
                // بررسی داده‌ها
                const keys = Object.keys(data);
                const values = keys.map((key) => data[key]);

                // تولید کوئری
                const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
                const [result] = await pool.query(sql, values);

                return { message: 'Data added successfully', id: result.insertId, result };
            }

            case 'delete': {
                // بررسی شرط
                const whereClause = Object.keys(condition)
                    .map((key) => `${key} = ?`)
                    .join(' AND ');
                const values = Object.values(condition);

                // تولید کوئری
                const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
                await pool.query(sql, values);

                return { message: 'Data deleted successfully' };
            }

            case 'update': {
                // بررسی داده‌ها
                const updateClause = Object.keys(data)
                    .map((key) => `${key} = ?`)
                    .join(', ');
                const updateValues = Object.values(data);

                // بررسی شرط
                const whereClause = Object.keys(condition)
                    .map((key) => `${key} = ?`)
                    .join(' AND ');
                const whereValues = Object.values(condition);

                // تولید کوئری
                const sql = `UPDATE ${table} SET ${updateClause} WHERE ${whereClause}`;
                await pool.query(sql, [...updateValues, ...whereValues]);

                return { message: 'Data updated successfully' };
            }

            case 'select': {
                // بررسی شرط
                const whereClause = Object.keys(condition)
                    .map((key) => `${key} = ?`)
                    .join(' AND ');
                const values = Object.values(condition);

                // تولید کوئری
                const sql = whereClause
                    ? `SELECT * FROM ${table} WHERE ${whereClause}`
                    : `SELECT * FROM ${table}`;
                const [rows] = await pool.query(sql, values);

                return rows;
            }

            default:
                throw new Error('Invalid action. Use "add", "delete", "update", or "select".');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Database operation failed.');
    }
}

module.exports = performCRUD;




// CRUD TUTORIAL
// ADD
// const data = { version: '0.1', layout: '4', web_url: 'www.localhost.com' };
// performCRUD('add', 'config', {}, data)
//     .then((result) => res.status(200).json(result))
//     .catch((err) => res.status(500).json(err));
//DELETE
// const condition = { id: 16 };
// performCRUD('delete', 'config', condition)
//     .then((result) => res.status(200).json(result))
//     .catch((err) => res.status(500).json(err));
//UPDATE
// const condition = { id: 15 };
// const data = { version: '0.2', layout: '2' };
// performCRUD('update', 'config', condition, data)
//     .then((result) => res.status(200).json(result))
//     .catch((err) => res.status(500).json(err));
//SELECT
// const condition = { };
// performCRUD('select', 'config', condition)
//     .then((rows) => res.status(200).json(rows))
//     .catch((err) => res.status(500).json(err));