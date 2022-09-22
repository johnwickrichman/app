let mysql = require('mysql');

let conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    pass: '',
    database: 'db_nodejs_ecommerce',
})

conn.connect((err) => {
    if (err) throw err;
    console.log('200 : Connect to Database success');
})


module.exports = conn;