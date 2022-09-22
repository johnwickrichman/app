let express = require('express');
let router = express.Router();
let conn = require('./connect');

let jwt = require('jsonwebtoken');
let secretCode = 'myecom2022key'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', (req, res) => {
  res.render('login');
})


router.post('/login', (req, res, next) => {
  let sql = 'SELECT * FROM tb_user WHERE user=? AND pwd=?';
  let params = [
    req.body['usr'],
    req.body['pwd']
  ]

  conn.query(sql,params,(err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // login pass
      let id = result[0].id;
      let name = result[0].name;

      // res.send('id = ' + id)

      let token = jwt.sign({ id: id, name: name}, secretCode);

      res.send(token);
    } else {
      res.send('username or password invalid')
    }
      
  })

})





module.exports = router;
