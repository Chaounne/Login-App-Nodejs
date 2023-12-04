const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const router = express.Router();
const uri = "mongodb+srv://cedric:go74fThK1WYkgnvg@teststrategin.wxn4jy0.mongodb.net/?retryWrites=true&w=majority";
const collectionName = 'LoginApp';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema, collectionName);

mongoose.connect(uri)
  .catch(error => {
    console.log('Error during connection:', error);
  });

app.use(express.urlencoded({ extended: true }));

router.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Base page\n');
});

router.get('/register', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <html>
      <head>
        <title>Register</title>
      </head>
      <body>
        <h1>Register</h1>
        <form method="POST" action="register">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required><br>

          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required><br>

          <input type="submit" value="Register">
        </form>
      </body>
    </html>
  `);
});

router.post('/register', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
    const newUser = new User({ email, password });
    const result = await newUser.save();
    console.log('Data inserted:', result._id);
  
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
        <html>
            <head>
                <title>Registration Successful</title>
            </head>
            <body>
                <h1>Registration Successful</h1>
                <p>Your email (${email}) and password have been registered.</p>
            </body>
        </html>
      `);
    } catch (error) {
      console.log('Error:', error);
    }
  });

router.get('/login', (req, res) => {
  const token = req.headers.cookie?.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('token='));

  if(token){
    try{
      const tokenValue = token.split('=')[1];
      const decoded = jwt.verify(tokenValue, 'secretKey');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(`
      <html>
        <head>
          <title>Login</title>
        </head>
        <body>
          <h1>Login</h1>
          <p>You are already connected !</p>
        </body>
      </html>
      `);
    } catch (error) {
      console.log('Error during login:', error);
    }
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <html>
        <head>
          <title>Login</title>
        </head>
        <body>
          <h1>Login</h1>
          <form method="POST" action="login">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required><br>

            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required><br>

            <input type="submit" value="Login">
          </form>
        </body>
      </html>
  `);
  }
  
});

router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
      const user = await User.findOne({ email, password });
  
      if (user) {
        const token = jwt.sign({ email: user.email, password: user.password }, 'secretKey');
        console.log('Token:', token);
  
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/`);
  
        res.statusCode = 302;
        res.setHeader('Location', '/users');
        res.end();
      } else {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
          <html>
            <head>
              <title>Login Failed</title>
            </head>
            <body>
              <h1>Login Failed</h1>
              <p>Invalid email or password.</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  });

router.get('/users', async (req, res) => {
  const token = req.headers.cookie?.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('token='));

  if (token) {
    try {
        const users = await User.find();
        const tokenValue = token.split('=')[1];
        const decoded = jwt.verify(tokenValue, 'secretKey');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
            <html>
                <head>
                <title>List of users</title>
                </head>
                <body>
                    <h1>List of users</h1>
                    <ul>
                    ` + 
                    users.map(user => `<li>${user.email}</li>`).join('') 
                    +
                    `</ul>
                </body>
            </html>
      `);
    } catch (error) {
        console.log('Invalid or expired token:', error);

        res.statusCode = 302;
        res.setHeader('Location', '/login');
        res.end();
    }
  } else {
        res.statusCode = 302;
        res.setHeader('Location', '/login');
        res.end();
  }
});

app.use('/', router);

const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});