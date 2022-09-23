const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_nodejs_ecommerce'
});
module.exports = pool.promise();