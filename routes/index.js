let express = require("express");
let router = express.Router();

let conn = require("./connect");

let jwt = require("jsonwebtoken");
let secretCode = "myecom2022key";

let formidable = require('formidable');
let fs = require('fs');

let dayjs = require('dayjs');
let dayFormat = 'DD/MM/YYYY';

let numeral = require('numeral');



// ---------------- ตั้งค่า session และ cookie time ------------------- //

const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const expire = 30 * 24 * 60 * 60 * 1000; // 1 month
router.use(sessions({
    secret: "sessionforecommerce",
    saveUninitialized: false,
    cookie: { maxAge: expire },
    resave: false
}));

router.use((req, res, next) => {

  /* ทำให้ใช้ session ได้ทุกหน้า */
    res.locals.session = req.session;

    res.locals.numeral = numeral;
    res.locals.dayjs = dayjs;
    res.locals.dayFormat = dayFormat;

    next();
});

// ---------------- End Session Gang ------------------- //



/* GET home page. */
/* Show Homepage */
router.get('/', async function(req, res, next) {

  let conn2 = require('./connect2');

  let search = [];

  let sql = " SELECT * FROM tb_product ";
  
  if (req.query.search != undefined) {
      sql += " WHERE name LIKE(?)";
      search.push("%" + req.query.search + "%");
  }

  if (req.query.groupProductId != undefined) {

      sql += " WHERE group_product_id = ?";
      search.push(req.query.groupProductId);
  }



  sql += " ORDER BY id DESC";
 
  try {
      let [ products, fields] = await conn2.query(sql, [search]);

      let sql2 = "SELECT * FROM tb_group_product ORDER BY name ASC";

      let [ groupProducts, fieldsGroupProduct] = await conn2.query(sql2);


      if (req.session.cart == undefined) {
          req.session.cart = [];
      }
      res.render('index', { products: products, groupProducts: groupProducts });
  } catch (e) {
      res.send("Error : " + e);
  }

});

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




/* GET Show Product Page. */
router.get('/product', isLogin, (req, res) => {

  let sql = "" +
      " SELECT tb_product.*, tb_group_product.name AS group_name FROM tb_product" +
      " LEFT JOIN tb_group_product ON" +
      " tb_group_product.id = tb_product.group_product_id" +
      " ORDER BY id DESC ";

  conn.query(sql, (err, result) => {
      if (err) throw err;

      res.render('product', { products: result });
  });
});



/* GET Add Product Page. */
router.get('/addProduct', isLogin, (req, res) => {

  let sql = "SELECT * FROM tb_group_product ORDER BY name ";

  conn.query(sql, (err, result) => {
      if (err) throw err;

      res.render('addProduct', { product: {}, groupProducts: result });
  });

});




/* POST Add Product Execute. */
router.post('/addProduct', isLogin, (req, res) => {

  let form = new formidable.IncomingForm();

  form.parse(req, (err, fields, file) => {

      let pGroupID = fields['group_product_id'];
      let pBarCode = fields['barcode'];
      let pName = fields['name'];
      let pPrice = fields['price'];
      let pCost = fields['cost'];

      let filePath = file.img.filepath;
      let newPath = './public/images/'
      newPath += file.img.originalFilename;

      let imageSize = file.img.size;

      let onlyImageFileName = file.img.originalFilename;

      if (imageSize > 0 && pBarCode && pName && pPrice && pCost) {

      fs.copyFile(filePath, newPath, () => {
          // After Copy We will Insert into Database
          let sql = "INSERT INTO tb_product SET group_product_id=?, barcode=?, name=?, price=?, cost=?, img=?";

          conn.query(sql, [pGroupID, pBarCode, pName, pPrice, pCost, onlyImageFileName], (err, result) => {
              if (err) throw err;
              res.redirect('/product');
          });
      });

    } else {
      res.send('กรุณากรอกข้อมูลสินค้า และ เลือกรูปภาพ ให้ครบนะคะ')
    }


  });
});





/* GET Edit Product Page. */
router.get('/editProduct/:id', isLogin, (req, res) => {

  let pid = req.params['id'];

  let sql = "SELECT * FROM tb_product WHERE id = ?";

  conn.query(sql, [pid], (err, products) => {
      if (err) throw err;

      let sql = "SELECT * FROM tb_group_product ORDER BY name";
      conn.query(sql, (err, gProduct) => {
          if (err) throw err;
          res.render('addProduct', { product: products[0], groupProducts: gProduct });
      });
  });
})



/* POST Edit Product Execute and Upload File / Delete Old File */
router.post('/editProduct/:id', isLogin, (req, res) => {

  let pid = req.params['id'];

  let form = new formidable.IncomingForm();

  form.parse(req, (err, fields, file) => {

      let pGroupID = fields['group_product_id'];
      let pBarCode = fields['barcode'];
      let pName = fields['name'];
      let pPrice = fields['price'];
      let pCost = fields['cost'];

      let imageSize = file.img.size;
      let filePath = file.img.filepath;
      let fileNameForm = file.img.originalFilename;
      let serverPath = './public/images/';

      let uploadPath = serverPath + fileNameForm;

      let onlyImageFileName = file.img.originalFilename;

      console.log('Image Size ---> ' + imageSize);

      // After Copy We will Insert into Database
      if (imageSize == 0) {

          // Not Change Image

          fs.copyFile(filePath, uploadPath, () => {
              let sql = "UPDATE tb_product SET group_product_id=?, barcode=?, name=?, price=?, cost=? WHERE id=?";
              conn.query(sql, [pGroupID, pBarCode, pName, pPrice, pCost, pid], (err, result) => {
                  if (err) throw err;
                  res.redirect('/product');
              });
          });

      } else {

          // Change New Image

          fs.copyFile(filePath, uploadPath, () => {

              // Delete Old Image First
              let sqlSelectOldImage = "SELECT img FROM tb_product WHERE id=? ";

              conn.query(sqlSelectOldImage, [pid], (err, oIMG) => {
                  if (err) throw err;

                  let selectImage = oIMG[0];

                  fs.unlink(serverPath + selectImage.img, (err) => {
                      if (err) throw err;

                      console.log("Old image deleted!!");
                  });
              });


              let sql = "UPDATE tb_product SET group_product_id=?, barcode=?, name=?, price=?, cost=?, img=? WHERE id=?";
              conn.query(sql, [pGroupID, pBarCode, pName, pPrice, pCost, onlyImageFileName, pid], (err, result) => {
                  if (err) throw err;
                  res.redirect('/product');
              });
          });

      } //end if

  });

})



/* GET Delete Product Execute */
router.get('/deleteProduct/:id', isLogin, (req, res) => {

  let did = req.params['id'];
  let serverPath = './public/images/';

  // Delete Old Image First
  let sqlSelectOldImage = "SELECT img FROM tb_product WHERE id=? ";
  conn.query(sqlSelectOldImage, [did], (err, oIMG) => {
      if (err) throw err;

      let selectImage = oIMG[0];

      fs.unlink(serverPath + selectImage.img, (err) => {
          if (err) throw err;

          console.log("Delete Old image Success!!");
      });
  });

  // Delete Data Reccord
  let sql = "DELETE FROM tb_product WHERE id=? ";

  conn.query(sql, [did], (err, result) => {
      if (err) throw err;

      console.log('Delete Product Data Reccord Success!!');
      res.redirect('/product');
  });

});















module.exports = router;
