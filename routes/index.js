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


module.exports = router;
