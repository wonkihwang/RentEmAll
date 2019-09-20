const express = require('express');
const app = express();
const path = require("path");
const http = require('http');
const https = require('https');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const expressLayouts = require('express-ejs-layouts');
const moment = require('moment');
var crypto = require('crypto');
var paypal = require('paypal-rest-sdk');
var flash = require('connect-flash');

const hostname = '10.10.193.142';
const port = 10034;
// const hostname = 'localhost';
// const port = 3030;

// Creating Server
const server = http.createServer(app).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
const io = require('socket.io')(server);

// Database
var dbConfig = {
  database: 'prj566_183a15',
  host: 'mymysql.senecacollege.ca',
  user: 'prj566_183a15',
  password: 'pdXT9724',
  multipleStatements: true
};

// Session
const session = require('express-session')({
  secret: '@#@$MYSIGN#@$#$',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 3600 * 1000
  }
});

// Nodemailer Transporter
var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'rentemallapp@gmail.com',
    pass: 'xfchjinuvfpucgcb'
  }
});

// Paypal Configuration
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'ATHArmjcEG1iYfsEZLOIuaqIX0yItp4mIxXt0lul4J6AUvYpJBvNHtRDKbIZKel6XPVtfyXv1deJHydI',
  'client_secret': 'EKkmgVT7B5q56wowHZLETqBrvVaUXHULu5mFelQrFuEM5ZkRa8CoSbyqkxGPwPxkl5rNwQCPF0v8gchh'
});

// Server Connection
var connection;
function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);
  connection.connect(function onConnect(err) {
    if (err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 10000);
    }
  });

  connection.on('error', function onError(err) {
    console.log('db error', err);
    if (err.code == 'PROTOCOL_CONNECTION_LOST' || err.code == 'ETIMEDOUT') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}
handleDisconnect();

app.set('views', __dirname + '/Rent-emAll-Web-Portal');
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(express.static('Rent-emAll-Web-Portal'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session);
app.use(function (req, res, next) {
  res.locals.sess = req.session;
  next();
})
app.use(flash());

const sharedsession = require('express-socket.io-session');
io.use(sharedsession(session, {
  autoSave: true
}));


/*****************************************************************************/
/********************              GET Request              ******************/
/*****************************************************************************/

app.get("/", function (req, res) {
  const sess = req.session;
  var query = "SELECT * FROM ItemTbl ORDER BY creationDate DESC LIMIT 6;"
  connection.query(query, function (err, results) {
    if (err) throw err;
    res.render('main', {
      name: sess.name,
      username: sess.username,
      items: results
    });
  });
});

app.get('/login', function (req, res) {
  const sess = req.session;
  if (!sess.username) {
    res.render('login');
  } else {
    res.render('main', { username: sess.username });
  }
});

app.get('/register', function (req, res) {
  const sess = req.session;
  if (!sess.username) {
    res.render('verifyemail');
  } else {
    res.render('main', { username: sess.username });
  }
});

app.get('/forgot', function (req, res) {
  if (!req.session.username) {
    res.render('forgot');
  } else {
    res.render('main', { username: sess.username });
  }
});

app.get('/aboutus', function (req, res) {
  res.render('about-us');
});

app.get('/faq', function (req, res) {
  res.render('faq');
});

app.get('/contactus', function (req, res) {
  res.render('contactus');
});

app.get('/list/:page', function (req, res) {
  const query = req.query;
  const page = parseInt(req.params.page);
  const allQueries = req.originalUrl.substring(7);
  var sql = "";
  var params = [];

  if (query.searchbar == 0)
    sql = "SELECT * FROM ItemTbl";
  else
    sql = "SELECT * FROM ItemTbl WHERE name LIKE '%" + query.searchbar + "%'";

  if (!query.searchbar)
    res.redirect('back');
  else {

    var firstCategory = Object.values(query)[0];

    if (query.home || query.tools || query.sports || query.entertainment || query.babies || query.fashion) {
      if (query.searchbar == 0)
        sql += " WHERE categoryId IN(";
      else
        sql += " AND categoryId IN(";

      if (query.home)
        sql += "1";

      if (firstCategory == 2)
        sql += "2";
      else if (query.tools)
        sql += ",2"

      if (firstCategory == 3)
        sql += "3";
      else if (query.sports)
        sql += ",3";

      if (firstCategory == 4)
        sql += "4";
      else if (query.entertainment)
        sql += ",4";

      if (firstCategory == 5)
        sql += "5";
      else if (query.babies)
        sql += ",5";

      if (firstCategory == 6)
        sql += "6";
      else if (query.fashion)
        sql += ",6";

      sql += ")";
    }

    if (query.deposit)
      sql += " AND deposit <= " + query.deposit;

    if (query.rate)
      sql += " AND rental_price_daily <= " + query.rate;

    if (query.sortby == "price")
      sql += " ORDER BY rental_price_daily";
    else if (query.sortby == "availability")
      sql += " ORDER BY availability DESC, creationDate DESC";
    else
      sql += " ORDER BY creationDate DESC";

    console.log(sql);

    var offset = 0;

    for (var i = 1; i < page; i++)
      offset += 10;

    connection.query(sql + " LIMIT 10 OFFSET " + offset + ";SELECT itemId, rating FROM ReviewTbl;SELECT userId, userName FROM UserTbl;" + sql, function (err, results) {
      if (err) throw err;

      const noOfItems = results[3].length;
      const totalPages = Math.ceil(noOfItems / 10);

      let mDates = [];
      let fDates = [];

      for (var i = 0; i < results[0].length; i++) {
        mDates[i] = moment(results[0][i].creationDate);
        fDates[i] = mDates[i].format('LL');
      }

      var rates = [];
      var averageRate = 0;

      for (var i = 0; i < results[0].length; i++) {
        var count = 0;
        averageRate = 0;

        for (var j = 0; j < results[1].length; j++) {
          if (results[1][j].itemId == results[0][i].itemId) {
            averageRate += results[1][j].rating;
            count++;
          }
        }
        averageRate /= count;
        if (averageRate)
          rates.push(averageRate);
        else
          rates.push(0);
      }

      var userNames = [];
      var found = false;
      for (var i = 0; i < results[0].length; i++) {
        found = false;

        for (var j = 0; j < results[2].length && !found; j++) {
          if (results[2][j].userId == results[0][i].userId) {
            userNames.push(results[2][j].userName);
            found = true;
          }
        }
      }

      res.render('itemlisting', {
        items: results[0],
        noOfItems: noOfItems,
        totalPages: totalPages,
        currentPage: page,
        postedDates: fDates,
        rates: rates,
        userNames: userNames,
        query: req.query,
        page: page,
        queries: allQueries
      });
    });
  }
});

app.get("/item/:id", function (req, res) {
  const sess = req.session;
  var itemId = req.params.id;

  connection.query("SELECT * FROM ItemTbl WHERE itemId = ?; SELECT * FROM ReviewTbl WHERE itemId = ?", [itemId, itemId],
    function (err, results) {
      if (err) throw err;

      var itemPostedDate = moment(results[0][0].creationDate);
      var fItemPostedDate = itemPostedDate.format('LL');

      var reviewPostedDate = [];
      var fReviewPostedDate = [];
      var averageRate = 0;

      if (results[1].length > 0) {
        for (var i = 0; i < results[1].length; i++) {
          reviewPostedDate[i] = moment(results[1][i].creationDate);
          fReviewPostedDate[i] = reviewPostedDate[i].format('LL');
          averageRate += results[1][i].rating;
        }

        averageRate /= results[1].length;
        averageRate = Math.round(averageRate * 10) / 10;
      }

      function getUser(username, callback) {
        connection.query("SELECT * FROM UserTbl WHERE userId = ?;", [results[0][0].userId],
          function (err, results) {
            if (err)
              callback(err, null);
            else
              callback(null, results[0]);
          });
      }

      getUser(results[0][0].userId, function (err, data) {
        if (err) throw err;

        res.render('item', {
          item: results[0][0],
          itemPostedDate: fItemPostedDate,
          user: data,
          review: results[1],
          reviewPostedDate: fReviewPostedDate,
          averageRate: averageRate,
          sess: sess,
          message: req.flash('warning')
        });
      });
    });
});

app.get('/map', function (req, res) {
  res.render('localmap');
});

app.get('/post', function (req, res) {
  if (req.session.username) {
    res.render('post-item');
  } else {
    res.redirect('/');
  }
});

app.get('/edit/:id', function (req, res) {
  if (req.session.username) {
    var itemId = req.params.id;

    connection.query("SELECT * FROM ItemTbl WHERE itemId = ?;", [itemId],
      function (err, result) {
        if (err) throw err;

        console.log(result[0]);
        res.render('edit-item', { item: result[0] });
      });
  } else {
    res.redirect('/');
  }
});

app.get('/rent/:id', function (req, res) {
  var sess = req.session;

  if (sess.username) {
    var itemId = req.params.id;

    connection.query("SELECT * FROM ItemTbl WHERE itemId = ?;", [itemId],
      function (err, result) {
        if (err) throw err;

        var userid = result[0].userId;

        function getUsername(userid, callback) {
          connection.query("SELECT * FROM UserTbl WHERE userId = ?;", [userid],
            function (err, results) {
              if (err)
                callback(err, null);
              else
                callback(null, results[0]);
            });
        }

        getUsername(userid, function (err, data) {
          if (err) throw err;

          res.render('rent', {
            item: result[0],
            lender: data,
            borrower: sess
          });
        });
      });
  } else {
    res.redirect('/');
  }
});

app.get('/profile', function (req, res) {
  var sess = req.session;
  if (!sess.username) {
    res.render('main');
  } else {
    res.render('user-profile', { sess: sess });
  }
});

app.get('/lenderpage', function (req, res) {
  var sess = req.session;
  if (!sess.username) {
    res.render('main');
  } else {
    connection.query("SELECT * FROM ItemTbl WHERE userId = ?", [sess.userid], function (err, results) {
      if (err) throw err;
      res.render('lenders-page', {
        sess: sess,
        items: results,
        moment: moment
      });
    });
  }
});

app.get('/lenderpage/:id', function (req, res) {
  var lenderUsername = req.params.id;

  connection.query("SELECT * FROM UserTbl WHERE userName = ?;", [lenderUsername],
    function (err, result) {
      if (err) throw err;

      function getItems(userid, callback) {
        connection.query("SELECT * FROM ItemTbl WHERE userId = ?;", [userid],
          function (err, results) {
            if (err)
              callback(err, null);
            else
              callback(null, results);
          });
      }

      getItems(result[0].userId, function (err, data) {
        if (err) throw err;

        var lender = {
          userid: result[0].userId,
          username: result[0].userName,
          firstname: result[0].firstName,
          lastname: result[0].lastName,
          postalcode: result[0].postalCode,
          phone: result[0].phoneNumber,
          email: result[0].emailAddress,
          prov: result[0].province
        }

        res.render('lenders-page', {
          sess: lender,
          items: data,
          moment: moment
        });
      });
    });
});

/************** eCommunication (Chatting app) **************/
app.get('/chat/:id', (req, res) => {
  var sess = req.session;
  var id = req.params.id;

  if (!sess.username) {
    res.render('main');
  } else {
    function getUsername(userid, callback) {
      connection.query("SELECT * FROM UserTbl WHERE userId = ?;", [userid],
        function (err, results) {
          if (err)
            callback(err, null);
          else
            callback(null, results[0]);
        });
    }

    getUsername(id, function (err, data) {
      if (err) throw err;

      res.render('chat', {
        user: sess,
        id: id,
        lender: data
      });
    });
  }
});

io.on('connection', function (socket) {
  var sess = socket.handshake.session;  // get session
  console.log('user ' + sess.username + ' connected: ', socket.id);
  var name = sess.username; // get username from session

  io.to(socket.id).emit('change name', name); // set into chat name

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('leaveRoom', (num, name) => {
    socket.leave(num, () => {
      console.log(name + ' leave a ' + num);
      io.to(num).emit('leaveRoom', num, name);
    });
  });

  socket.on('joinRoom', (num, name) => {
    socket.join(num, () => {
      console.log(name + ' join a ' + num);
      io.to(num).emit('joinRoom', num, name);
    });
  });

  socket.on('send message', function (num, name, text) {
    var msg = name + ': ' + text;
    io.to(num).emit('receive message', msg);
  });
});

app.get('/cart', function (req, res) {
  var sess = req.session;
  if (!sess.username) {
    res.render('main');
  } else {
    res.render('cart', { cart: sess.cart });
  }
});

app.get('/remove/:id', function (req, res) {
  var sess = req.session;
  var id = req.params.id;

  if (!sess.username) {
    res.redirect('/cart');
  } else {
    if (sess.cart) {
      var cart = sess.cart;
    } else {
      var cart = [];
    }

    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        console.log(cart[i]);
        cart.splice(i, 1);
      }
    }

    sess.cart = cart;
    res.redirect('/cart');
  }
});

app.get('/payment', function (req, res) {
  var sess = req.session;
  if (!sess.username) {
    res.redirect('/');
  } else {
    res.render('payment', { cart: sess.cart });
  }
});

app.get('/success', function (req, res) {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const subtotal = req.session.subtotal;
  const sess = req.session;

  console.log('PayerID: ' + payerId);
  console.log('PaymentID: ' + paymentId);

  var execute_payment_object = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "CAD",
        "total": subtotal
      }
    }]
  };

  const execute_payment_json = JSON.stringify(execute_payment_object);

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      var mailOpts;
      console.log(sess.cart);
      // put "transaction information" into database here
      sess.cart.forEach(function (eachItem) {
        connection.query("INSERT INTO OrderLineTbl (itemId, itemName, photoURL, borrowerid, borrower, lenderid, lender, lenderemail, rentalStartDate, rentalEndDate, rentaldays, rentPerDay, depositPrice, total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
          eachItem.id, eachItem.name, eachItem.image, sess.userid, sess.username, eachItem.lenderid, eachItem.lender, eachItem.lenderemail, eachItem.startDate, eachItem.endDate, eachItem.rentaldays, eachItem.rentalprice, eachItem.deposit, eachItem.total
        ], function (err, result) {
          if (err) {
            console.log("Error while inserting order data: " + err);
          } else {
            console.log("Successfully insert data: " + result);
          }
        });
      })

      // update "availability of rented item(s)" and "returning date"
      sess.cart.forEach(function (eachItem) {
        connection.query("UPDATE ItemTbl SET availability = false WHERE itemId = ?", [eachItem.id], function (err, result) {
          if (err) {
            console.log("Error while updating availability: " + err);
          } else {
            console.log("Item #" + eachItem.id + " has been disabled due to rent out.");
          }
        });

        // Create event scheduler
        var eventQuery = "CREATE EVENT rentevent" + eachItem.id + " ON SCHEDULE AT '" + eachItem.endDate + "' + INTERVAL 1 DAY DO UPDATE ItemTbl SET availability = 1 WHERE itemId = " + eachItem.id + ";";
        console.log(eventQuery);
        connection.query(eventQuery, function (err, result) {
          if (err) {
            console.log("Error while updating availability: " + err);
          } else {
            console.log("Event Scheduler has created successfully.");
          }
        });
      })

      var itemListString = ""; // temporary string to contain item list

      // Mail(s) will be sent to the lender(s)
      sess.cart.forEach(function (eachItem) {
        itemListString += "<p>- " + eachItem.name + " (From " + eachItem.startDate + " to " + eachItem.endDate + ")"
          + " Total $: " + eachItem.total + " Lender: " + eachItem.lender + "(" + eachItem.lenderemail + ")</p>";

        // Compose confirm email(s) to lender(s)
        mailOpts = {
          from: 'rentemallapp@gmail.com',
          to: eachItem.lenderemail,
          subject: eachItem.lender + ". Your item has been rented!",
          html: "<p>Hello, <b>" + eachItem.lender + "</b>.</p>"
            + "<p>Your item <b>'" + eachItem.name + "\'</b> has been rented by <b>" + sess.username + "</b>(" + sess.email + ").</p><br>"
            + "<p>- Rental Start Date: <b>" + eachItem.startDate + "</b></p>"
            + "<p>- Rental End Date: <b>" + eachItem.endDate + "</b></p>"
            + "<br><p>Please lend the item according to the arranged delivery method.<br>Thank you.</p>"
        }
        transporter.sendMail(mailOpts, function (error, response) {
          if (error) throw error;
          else console.log("Email to lender(s) has been sent!");
        });
      });

      // Mail will be sent to the borrower (current session user)
      mailOptsUser = {
        from: 'rentemallapp@gmail.com',
        to: sess.email,
        subject: sess.username + ". Your payment has processed succesfully!",
        html: "<p>Hello, <b>" + sess.username + "</b>.</p>"
          + "<p>You have rent the item(s) successfully. Below is the list:</p><br>"
          + itemListString
          + "<br><p>Please borrow the item(s) according to the arranged delivery method.<br>Thank you.</p>"
      }
      transporter.sendMail(mailOptsUser, function (error, response) {
        if (error) throw error;
        else console.log("Email to borrower has been sent!");
      });

      req.session.subtotal = 0;
      req.session.cart = {};
      res.render('message', {
        title: 'Payment Success!',
        content: 'Your payment has been successfully processed. Thank you.'
      });
    }
  });
});

app.get('/cancel', function (req, res) {
  res.send('');
  res.render('message', {
    title: 'Payment Failure!',
    content: 'Unfortunately, your payment has been cancelled.'
  });
});

app.get('/logout', function (req, res) {
  var sess = req.session;
  if (sess.username) {
    req.session.destroy(function (err) {
      if (err) {
        throw err;
      } else {
        res.redirect('/');
      }
    })
  } else {
    res.redirect('/');
  }
});


/*****************************************************************************/
/********************             POST Request              ******************/
/*****************************************************************************/

app.post('/signup', function (req, res) {
  var body = req.body;
  var key = 'myKey';
  var cipher = crypto.createCipher('aes192', key);
  cipher.update(body.password, 'utf8', 'base64');
  var cipheredOutput = cipher.final('base64');

  var province = verifyProvince(body.postalcode);
  if (province) {
    connection.query("INSERT INTO UserTbl (firstName, lastName, userName, password, emailAddress, phoneNumber, province, postalCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
      body.firstname, body.lastname, body.username, cipheredOutput, body.email, body.phoneNum, province, body.postalcode
    ], function (err, result) {
      if (err) {
        res.render('error', { errormessage: 'Unable to register a new user to the database.' });
      } else {
        // send registration success email
        var mailOpts = {
          from: 'rentemallapp@gmail.com',
          to: body.email,
          subject: "Welcome to Rent'emAll!",
          html: "<p>Hello, <b>" + body.firstname + "</b>.</p>"
            + "<p>You have successfully registered.</p>"
            + "<p>Your username is <b>" + body.username + "</b>.</p>"
            + "<p>Thank you.</p>"
        }
        transporter.sendMail(mailOpts, function (error, response) {
          if (error) {
            throw error;
          } else {
            console.log("Email to a new user has been sent!");

            // Success message and redirect to login page
            req.flash('Success', 'Your account has been registered. Please log in.')
            res.redirect('login');
          }
        });
      }
    });
  } else {
    res.render('error', { errormessage: 'Postal code does not exist.' });
  }
});

var rand, mailOptions, host, link;
app.post('/verifyemail', function (req, res) {
  rand = Math.floor((Math.random() * 100) + 54);
  host = req.get('host');
  link = "http://" + req.get('host') + "/verify?id=" + rand;
  var enteredEmail = req.body.v_email;

  // Check email does exist in the database
  connection.query('SELECT * FROM UserTbl WHERE emailAddress = ?', [enteredEmail], function (err, result) {
    if (err) {
      throw err;
    } else {
      if (result.length > 0) {  // email does exist in the database
        res.render('error', {
          errormessage: 'The email address you have entered is already registered.'
        });
      } else {
        // create confirmation email
        mailOptions = {
          from: 'rentemallapp@gmail.com',
          to: enteredEmail,
          subject: "Please confirm your Email account",
          html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
        }
        // send confirmation email
        transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            throw error;
          } else {
            console.log("Message sent: " + response.message);
            res.render('message', {
              title: 'Email has been sent.',
              content: 'Please look for the verification email in your inbox and click the link in that email.'
            });
          }
        });
      }
    }
  });
});

app.get('/verify', function (req, res) {
  console.log(req.protocol + ":/" + req.get('host'));
  if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
    console.log("Domain is matched. Information is from Authentic email");
    if (req.query.id == rand) {
      console.log("email is verified");
      res.render('register', { email: mailOptions.to });
    }
    else {
      console.log("email is not verified");
      res.end("<h1>Bad Request</h1>");
    }
  }
  else {
    res.end("<h1>Request is from unknown source");
  }
});

app.post('/login', function (req, res) {
  var userid = req.body.username;
  var password = req.body.password;
  var key = 'myKey';
  var sess = req.session;

  connection.query('SELECT * FROM UserTbl WHERE BINARY userName = ?', [userid], function (err, result) {
    if (err) {
      throw err;
    } else {
      if (result.length === 0) {
        res.render('error', { errormessage: 'You just entered invalid username.' });
      } else {
        var decipher = crypto.createDecipher('aes192', key);
        decipher.update(result[0].password, 'base64', 'utf8');
        var decipheredOutput = decipher.final('utf8');

        if (password != decipheredOutput) {
          res.render('error', { errormessage: 'You just entered invalid password.' });
        } else {
          sess.userid = result[0].userId;
          sess.username = result[0].userName;
          sess.name = result[0].firstName + ' ' + result[0].lastName;
          sess.firstname = result[0].firstName
          sess.lastname = result[0].lastName;
          sess.postalcode = result[0].postalCode;
          sess.phone = result[0].phoneNumber;
          sess.email = result[0].emailAddress;
          sess.prov = result[0].province;
          res.redirect('/');
        }
      }
    }
  });
});

app.post('/forgotuser', function (req, res) {
  var email = req.body.email;

  connection.query('SELECT * FROM UserTbl WHERE emailAddress = ?', [email], function (err, result) {
    if (err) {
      throw err;
    } else {
      if (result.length === 0) {
        res.render('error', { errormessage: 'Email address does not exist.' });
      } else {
        var mailOpts = {
          from: 'rentemallapp@gmail.com',
          to: email,
          subject: 'RentemAll Username Request',
          text: `Hi ${result[0].firstName},\n\nYour username is "${result[0].userName}"`
        };
        transporter.sendMail(mailOpts, function (error, response) {
          if (error) {
            res.end("Email send failed");
          } else {
            res.redirect('/');
          }
        });
      }
    }
  });
});

app.post('/forgotpass', function (req, res) {
  var username = req.body.username;
  var email = req.body.email;

  connection.query('SELECT * FROM UserTbl WHERE emailAddress = ? AND BINARY userName = ?', [email, username], function (err, result) {
    if (err) {
      throw + err;
    } else {
      if (result.length === 0) {
        res.render('error', { errormessage: 'Invalid email and/or username.' });
      } else {
        var newPW = randomPassword();

        var key = 'myKey';
        var cipher = crypto.createCipher('aes192', key);
        cipher.update(newPW, 'utf8', 'base64');
        var cipheredOutput = cipher.final('base64');

        connection.query('UPDATE UserTbl SET password = ? WHERE userName = ?', [cipheredOutput, username], function (err, result) {
          if (err) {
            throw err;
          } else {
            res.redirect('/');
          }
        });

        var mailOpts = {
          from: 'rentemallapp@gmail.com',
          to: email,
          subject: 'RentemAll Password Reset Request',
          text: `Hi ${result[0].firstName},\n\nYour new password is "${newPW}". After login, Please go to user profile page and change your password.`
        };
        transporter.sendMail(mailOpts, function (error, response) {
          if (error) {
            res.end("Email send failed");
          } else {
            res.redirect('/');
          }
        });
      }
    }
  });
});

app.post('/sendemail', function (req, res) {
  var mailOpts = {
    from: `${req.body.contactName} <${req.body.contaceEmail}>`,
    to: 'rentemallapp@gmail.com',
    subject: 'RentemAll Question Request',
    text: `${req.body.contactName} (${req.body.contaceEmail}) says: ${req.body.message}`
  };
  transporter.sendMail(mailOpts, function (error, response) {
    if (error) {
      res.end("Email send failed");
    } else {
      res.redirect('/');
    }
  });
});

/**************** Post Item ****************/
var upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './Rent-emAll-Web-Portal/uploads/images/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    }
  })
});
app.post('/postItem', upload.single('photoURL'), function (req, res) {
  var sess = req.session;
  var body = req.body;
  var filePath = '../uploads/images/' + req.file.filename;

  connection.query("INSERT INTO ItemTbl(userId, categoryId, name, description, purchasedYear, purchasedPrice, rental_price_daily, deposit, itemStartDate, itemFinishDate, photoURL) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
    sess.userid, body.category, body.name, body.description, body.purchasedYear, body.purchasedPrice, body.rentPerDay, body.depositPrice, body.itemStartDate, body.itemFinishDate, filePath
  ], function (err, result) {
    if (err) {
      res.render('error', { errormessage: 'Unable to post your item.' });
    } else {
      res.redirect('/item/' + result.insertId);
    }
  });
});

app.post('/editItem', upload.single('photoURL'), function (req, res) {
  var sess = req.session;
  var body = req.body;
  var filePath = '../uploads/images/' + req.file.filename;

  connection.query("UPDATE ItemTbl SET categoryId = ?, name = ?, description = ?, purchasedYear = ?, purchasedPrice = ?, rental_price_daily = ?, deposit = ?, itemStartDate = ?, itemFinishDate = ?, photoURL = ? WHERE itemId =?", [
    body.category, body.name, body.description, body.purchasedYear, body.purchasedPrice, body.rentPerDay, body.depositPrice, body.itemStartDate, body.itemFinishDate, filePath, body.itemId
  ], function (err, result) {
    if (err) {
      res.render('error', { errormessage: 'Unable to update your item.' });
    } else {
      res.redirect('/item/' + body.itemId);
    }
  });
});

app.post('/deleteItem', function (req, res) {
  var sess = req.session;
  var body = req.body;
  if (sess) {
    if (sess.userid == body.userId) {
      connection.query("DELETE FROM ItemTbl WHERE itemId = ?", [body.itemId], function (err, result) {
        if (err) {
          res.render('error', { errormessage: 'Unable to delete your item.' });
        } else {
          res.redirect('/');
        }
      });
    }
  } else {
    res.redirect('/lenderpage');
  }
});

app.post('/profile', function (req, res) {
  var sess = req.session;
  var body = req.body;

  if (body.password === '') {
    connection.query('UPDATE UserTbl SET postalCode = ?, phoneNumber = ?, emailAddress = ? WHERE BINARY userName = ?', [
      body.postalcode, body.phoneNum, body.email, body.username
    ], function (err, result) {
      if (err) {
        throw err;
      } else {
        var province = verifyProvince(body.postalcode);
        if (province) {
          sess.postalcode = body.postalcode;
          sess.phone = body.phoneNum;
          sess.email = body.email;
          sess.prov = province;
          res.redirect('/profile');
        } else {
          res.render('error', { errormessage: 'Postal code does not exist.' });
        }
      }
    });
  } else {
    var key = 'myKey';
    var cipher = crypto.createCipher('aes192', key);
    cipher.update(body.password, 'utf8', 'base64');
    var cipheredOutput = cipher.final('base64');

    connection.query('UPDATE UserTbl SET password = ?, postalCode = ?, phoneNumber = ?, emailAddress = ? WHERE BINARY userName = ?', [
      cipheredOutput, body.postalcode, body.phoneNum, body.email, body.username
    ], function (err, result) {
      if (err) {
        throw err;
      } else {
        var province = verifyProvince(body.postalcode);
        if (province) {
          sess.postalcode = body.postalcode;
          sess.phone = body.phoneNum;
          sess.email = body.email;
          sess.prov = province;
          res.redirect('/profile');
        } else {
          res.render('error', { errormessage: 'Postal code does not exist.' });
        }
      }
    });
  }
});

app.post('/cart/:id', function (req, res) {
  var sess = req.session;
  var id = req.params.id;
  var body = req.body;

  if (!sess.username) {
    res.redirect('/item/' + id);
  } else {
    if (sess.cart) {
      var cart = sess.cart;
    } else {
      var cart = [];
    }

    function getItem(id, callback) {
      connection.query("SELECT * FROM ItemTbl WHERE itemId = ?;", [id],
        function (err, results) {
          if (err)
            callback(err, null);
          else
            callback(null, results[0]);
        });
    }

    function getUser(userid, callback) {
      connection.query("SELECT * FROM UserTbl WHERE userId = ?;", [userid],
        function (err, results) {
          if (err)
            callback(err, null);
          else
            callback(null, results[0]);
        });
    }

    getItem(id, function (err, data) {
      if (err) throw err;

      getUser(data.userId, function (err, userdata) {
        if (err) throw err;

        // temporary shopping object
        var shoppingItem = {
          id: id,
          name: data.name,
          image: data.photoURL,
          lenderid: userdata.userId,
          lender: userdata.userName,
          lenderemail: userdata.emailAddress,
          deposit: body.deposit,
          rentalprice: body.rentalprice,
          rentaldays: body.rentaldays,
          total: body.total,
          startDate: body.rentalStart,
          endDate: body.rentalEnd
        }

        var exist = false;
        for (var i = 0; i < cart.length; i++) {
          if (cart[i].id == id) {
            exist = true;
          }
        }
        if (!exist) {
          cart.push(shoppingItem);
        }
        sess.cart = cart;

        console.log(cart);

        res.redirect('/cart');
      });
    });
  }
});

app.post('/pay', function (req, res) {
  var cart = req.session.cart;
  var subtotal = req.body.subtotal;
  req.session.subtotal = subtotal;

  var successlink = 'http://myvmlab.senecacollege.ca:6311/success';
  var cancellink = 'http://myvmlab.senecacollege.ca:6311/cancel';
  // var successlink = 'http://localhost:3030/success';
  // var cancellink = 'http://localhost:3030/cancel';

  var items = [];
  var item = {};

  cart.forEach(function (eachItem) {
    item = {
      "name": eachItem.name,
      "sku": eachItem.id,
      "price": eachItem.total,
      "currency": "CAD",
      "quantity": 1
    }
    items.push(item);
  })

  const create_payment_object = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": successlink,
      "cancel_url": cancellink
    },
    "transactions": [{
      "item_list": {
        "items": items
      },
      "amount": {
        "currency": "CAD",
        "total": subtotal
      }
    }]
  };

  create_payment_json = JSON.stringify(create_payment_object);

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.post('/item/:id', function (req, res) {
  const itemId = req.params.id;
  const body = req.body;
  const sess = req.session;
  const userIdItemIdSet = sess.userid + itemId;
  var currentDate = new Date();
  var rating = 0;

  if (body.ratingVal)
    rating = body.ratingVal;

  connection.query("SELECT userName FROM UserTbl WHERE userId = ?", [sess.userid], function (err, result) {
    if (err) throw err;

    var userName = result[0].userName;

    connection.query("SELECT userId FROM ReviewTbl WHERE itemId = ?", [itemId], function (err, result2) {
      if (err) throw err;

      var doesUserIdExist = false;
      for (var i = 0; i < result2.length && !doesUserIdExist; i++) {
        if (result2[i].userId == sess.userid)
          doesUserIdExist = true;
      }

      if (doesUserIdExist) {
        req.flash('warning', 'Cannot post more than one review per item.')
        res.redirect('back');
      }
      else {
        connection.query("INSERT INTO ReviewTbl (userId, userName, itemId, creationDate, reviewTitle, reviewText, rating) VALUES(?,?,?,?,?,?,?)",
          [sess.userid, userName, itemId, currentDate, body.title, body.review, rating],
          function (err, result3) {
            if (err) throw err;

            res.redirect('/item/' + itemId);
          });
      }
    })
  });
});

app.post('/deleteReview/:reviewId', function (req, res) {
  connection.query("DELETE FROM ReviewTbl WHERE reviewId = ?", [req.params.reviewId], function (err, result) {
    if (err) throw err;

    res.redirect('/item/' + req.body.reviewItemId);
  });
});

app.post('/editReview/:reviewId', function (req, res) {
  const body = req.body;
  var rating = 0;

  if (body.ratingVal)
    rating = body.ratingVal;

  connection.query("UPDATE ReviewTbl SET reviewTitle = ?, reviewText = ?, rating = ? WHERE reviewId = ?", [body.editTitle, body.editReviewContent, rating, req.params.reviewId], function (err, result) {
    if (err) throw err;

    res.redirect('/item/' + body.editReviewItemId);
  });
});

/*****************************************************************************/
/********************             404 Not Found             ******************/
/*****************************************************************************/

app.all('*', function (req, res) {
  res.status(404).send('<h1>Error 404: Page Not Found</h1>');
});


/*************** Verify province function **************/
function verifyProvince(postalcode) {
  var postalFirstLetter = postalcode.substr(0, 1).toUpperCase();
  var province = '';
  if (postalFirstLetter === 'A') province = 'NL';
  else if (postalFirstLetter === 'B') province = 'NS';
  else if (postalFirstLetter === 'C') province = 'PE';
  else if (postalFirstLetter === 'E') province = 'NB';
  else if (postalFirstLetter === 'G' || postalFirstLetter === 'H' || postalFirstLetter === 'J') province = 'QC';
  else if (postalFirstLetter === 'K' || postalFirstLetter === 'L' || postalFirstLetter === 'M' || postalFirstLetter === 'N' || postalFirstLetter === 'P') province = 'ON';
  else if (postalFirstLetter === 'R') province = 'MB';
  else if (postalFirstLetter === 'S') province = 'SK';
  else if (postalFirstLetter === 'T') province = 'AB';
  else if (postalFirstLetter === 'V') province = 'BC';
  else if (postalFirstLetter === 'X') province = 'NN';
  else if (postalFirstLetter === 'Y') province = 'YT';
  else province = null;

  return province;
}

/*************** Random password generator **************/
function randomPassword() {
  var randomPW = "";
  var possibleUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var possibleLower = "abcdefghijklmnopqrstuvwxyz";
  var possibleNum = "0123456789";

  for (var i = 0; i < 4; i++) {
    randomPW += possibleUpper.charAt(Math.floor(Math.random() * possibleUpper.length));
    randomPW += possibleNum.charAt(Math.floor(Math.random() * possibleNum.length));
    randomPW += possibleLower.charAt(Math.floor(Math.random() * possibleLower.length));
  }

  return randomPW;
}
