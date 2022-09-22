let express = require("express")
let router = express.Router()
let conn = require("./connect")

let jwt = require("jsonwebtoken")
let secretCode = "myecom2022key"

let session = require("express-session")

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

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" })
})

/* GET login page. */
router.get("/login", (req, res) => {
  res.render("login")
})

/* POST login page. */
router.post("/login", (req, res, next) => {
  let sql = "SELECT * FROM tb_user WHERE user=? AND pwd=?"
  let params = [req.body["usr"], req.body["pwd"]]

  conn.query(sql, params, (err, result) => {
    if (err) throw err

    if (result.length > 0) {
      // login pass
      let id = result[0].id
      let name = result[0].name

      // res.send('id = ' + id)

      let token = jwt.sign({ id: id, name: name }, secretCode)

      req.session.token = token
      req.session.name = name

      res.redirect("/home")
    } else {
      res.send("username or password invalid")
    }
  })
})

/* Middleware isLogin. */
function isLogin(req, res, next) {
  if (req.session.token != undefined) {
    next()
  } else {
    res.redirect("/login")
  }
}

/* GET Home page. */
router.get("/home", isLogin, (req, res) => {
  res.render("home")
})

module.exports = router
