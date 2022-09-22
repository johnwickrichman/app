let express = require("express");
let router = express.Router();
let conn = require("./connect");

let jwt = require("jsonwebtoken");
let secretCode = "myecom2022key";

let session = require("express-session");


/* ตั้งค่า session และ cookie time */
router.use(
  session({
    secret: "sessionforecommerce",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
)


/* ทำให้ใช้ session ได้ทุกหน้า */
router.use( (req, res, next) => {
  res.locals.session = req.session;
  next();
})


/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
})

/* GET login page. */
router.get("/login", (req, res) => {
  res.render("login");
})

/* POST login page. */
router.post("/login", (req, res, next) => {
  let sql = "SELECT * FROM tb_user WHERE user=? AND pwd=?";
  let params = [req.body["usr"], req.body["pwd"]];

  conn.query(sql, params, (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // login pass
      let id = result[0].id;
      let name = result[0].name;

      // res.send('id = ' + id)

      let token = jwt.sign({ id: id, name: name }, secretCode);

      req.session.token = token;
      req.session.name = name;

      res.redirect("/home");
    } else {
      res.send("username or password invalid");
    }
  })
})

/* Middleware isLogin. */
function isLogin(req, res, next) {
  if (req.session.token != undefined) {
    next();
  } else {
    res.redirect("/login");
  }
}

/* GET Home page. */
router.get("/home", isLogin, (req, res) => {
  res.render("home");
})


/* GET Logout Coding */
router.get("/logout", isLogin, (req, res) => {
  req.session.destroy();
  res.redirect('/login');
})


/* GET Change Profile Page. */
router.get("/changeProfile", isLogin, (req, res) => {

  let data = jwt.verify(req.session.token, secretCode);

  let sql = "SELECT * FROM tb_user WHERE id = ?";
  let params = data.id;

  conn.query(sql, params, (err, result) => {
      if (err) throw err;
      res.render('changeProfile', { user: result[0] });
  })

})


/* POST Change Profile Execute. */
router.post("/changeProfile", isLogin, (req, res) => {

  let data = jwt.verify(req.session.token, secretCode);

  let mid = data.id;
  let update_name = req.body['name'];
  let update_user = req.body['user'];
  let update_pass = req.body['pass'];

  if (update_pass) {
      // ถ้า มี การแก้รหัสผ่านด้วย

      let sql = "UPDATE tb_user SET name=? , user=?, pwd=? WHERE id=?";

      conn.query(sql, [update_name, update_user, update_pass, mid], (err, result) => {
          if (err) throw err;

          console.log(result);

          req.session.message = "Update Profile Success";
          res.redirect('/changeProfile');
      });

  } else {
    // ถ้า ไม่มี การแก้รหัสผ่าน

      let sql = "UPDATE tb_user SET name=? , user=? WHERE id=?";

      conn.query(sql, [update_name, update_user, mid], (err, result) => {
          if (err) throw err;

          console.log(result);
          console.log(`mid = ${mid}`);

          req.session.message = "แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้วค่ะ";
          res.redirect('/changeProfile');
      });

  }

})



/* Show All User Page. */
router.get('/user', isLogin, (req, res) => {
  let sql = "SELECT * FROM tb_user ORDER BY id DESC";
  conn.query(sql, (err, result) => {
      if (err) throw err;
      res.render('user', { users: result });

  })

});




/* GET Add User Page */
router.get('/addUser', isLogin, (req, res) => {
  res.render('addUser', { user: {} });
});



/* POST Add User Execute */
router.post('/addUser', isLogin, (req, res) => {

  let update_name = req.body['name'];
  let update_user = req.body['user'];
  let update_pass = req.body['pass'];
  let update_level = req.body['level'];

  if (update_name && update_user && update_pass && update_level) {

      let sql = "INSERT INTO tb_user SET name=? , user=? , pwd=?, level=?";
      conn.query(sql, [update_name, update_user, update_pass, update_level], (err, result) => {
          if (err) throw err;
          res.redirect('/user');
      });
  } else {
      res.send('กรุณากรอกข้อมูลให้ครบทุกช่องนะคะ');

  }
});



/* GET Edit User Page */
router.get('/editUser/:id', isLogin, (req, res) => {

  let mid = req.params['id'];
  let sql = "SELECT * FROM tb_user WHERE id=?";

  conn.query(sql, [mid], (err, result) => {
      if (err) throw err;
      res.render('addUser', { user: result[0] });
  });
});



/* POST Edit User Execute */
router.post('/editUser/:id', isLogin, (req, res) => {

  let mid = req.params['id'];
  let update_name = req.body['name'];
  let update_user = req.body['user'];
  let update_pass = req.body['pass'];
  let update_level = req.body['level'];

  let sql = "UPDATE tb_user SET name=? , user=? , pwd=? , level=? WHERE id=?";

  conn.query(sql, [update_name, update_user, update_pass, update_level, mid], (err, result) => {
      if (err) throw err;
      res.redirect('/user');
  });
});



/* Delete user Execute */
router.get('/deleteUser/:id', isLogin, (req, res) => {

  let mid = req.params['id'];

  let sql = "DELETE FROM tb_user WHERE id=? ";
  conn.query(sql, [mid], (err, result) => {
      if (err) throw err;
      res.redirect('/user');
  });
});



/* GET Show Group Product Page. */
router.get('/groupProduct', isLogin, (req, res) => {

  let sql = "SELECT * FROM tb_group_product";

  conn.query(sql, (err, result) => {
      if (err) throw err;
      res.render('groupProduct', { groupProducts: result });
  });
});



/* GET Add Group Product Page. */
router.get('/addGroupProduct', isLogin, (req, res) => {

  res.render('addGroupProduct', { groupProduct: {} });
});



/* POST Add Group Product Execute. */
router.post('/addGroupProduct', isLogin, (req, res) => {

  let g_name = req.body['name'];

  if (g_name) {
      let sql = "INSERT INTO tb_group_product SET name=?";
      conn.query(sql, [g_name], (err, result) => {
          if (err) throw err;
          res.redirect('/groupProduct');
      });
  } else {
      res.send('กรุณากรอกชื่อประเภทสินค้าก่อนนะคะ');
  }
});



/* GET Edit Group Product Page. */
router.get('/editGroupProduct/:id', isLogin, (req, res) => {

  let gid = req.params['id'];
  let sql = "SELECT * FROM tb_group_product WHERE id=?";
  conn.query(sql, [gid], (err, result) => {
      if (err) throw err;
      res.render('addGroupProduct', { groupProduct: result[0] });
  });
});



/* POST Edit Group Product Execute. */
router.post('/editGroupProduct/:id', isLogin, (req, res) => {

  let gid = req.params['id'];
  let gName = req.body['name'];
  let sql = "UPDATE tb_group_product SET name=? WHERE id=? ";
  conn.query(sql, [gName, gid], (err, result) => {
      if (err) throw err;
      res.redirect('/groupProduct');
  });
});




/* GET Delete Group Product Execute. */
router.get('/deleteGroupProduct/:id', isLogin, (req, res) => {

  let did = req.params['id'];
  let sql = "DELETE FROM tb_group_product WHERE id=? ";

  conn.query(sql, [did], (err, result) => {
      if (err) throw err;

      res.redirect('/groupProduct');
  });

});





module.exports = router;
