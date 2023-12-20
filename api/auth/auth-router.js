const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const router = require('express').Router();
const User = require('../users/users-model')

const { BCRYPT_ROUNDS, JWT_SECRET } = require('../../config')

router.post('/register', (req, res, next) => {
  // res.end('implement register, please!');
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
 let user = req.body;

 if (!user.username || !user.password) {
  return res.status(400).json({ message: 'username and password required'})
 }

 const hash = bcrypt.hashSync(user.password, BCRYPT_ROUNDS);
 user.password = hash;

 User.add(user)
      .then(saved => {
        res.status(201).json({ id: saved.id, username: saved.username, password: saved.password });
      })
      .catch(error => {
        if (error.message.includes('UNIQUE constraint failed: users.username')) {
          return res.status(400).json({ message: 'username taken' })
        }

        next(error);
      })
});

router.post('/login', (req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password required' })
  }

  User.findBy({ username })
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);

        res.status(200).json({
          message: `Welcome, ${user.username}`,
          token,
        });
      } else {
        res.status(401).json({ message: 'invalid credentials' })
      }
    })
    .catch(next)
});

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
    role: user.role,
  };
  const options = {
    expiresIn: '1d',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

module.exports = router;
