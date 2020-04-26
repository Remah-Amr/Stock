const express = require('express')
const router = express.Router()
const fs = require('fs')
const {ensureAuthenticated,ensureGuest} = require('../helper/auth')
const cloud = require('../cloudinaryConfig')
const {multerConfigImage} = require('../multer')
const User = require('../models/user')
const passport = require('passport')
const bcrypt = require('bcryptjs')
require('../config/passport')

 // get login
 router.get('/login', ensureGuest, (req, res, next) => {
    res.render('login');
  });
  
  // get register
  router.get('/signup', ensureGuest, (req, res, next) => {
    res.render('signup');
  });
  
  
  // post register
  router.post('/signup', multerConfigImage, async (req, res, next) => { 
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const shop = req.body.shop
    if(req.file && name && password && email && shop){
      const result = await cloud.uploads(req.file.path)
      User.findOne({ email: req.body.email }).then(user => {
        if (user) {
          req.flash('error', 'Email already in use!');
          res.redirect('/signup');
        }
        else {
         
      
          // delete image local
          fs.unlinkSync(req.file.path)
      
          const newUser = {
            name,
            email,
            password,
            imageUrl:result.url,
            shop
          }
       
          bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(newUser.password, salt, function (err, hash) {
              if (err) throw err;
              newUser.password = hash;
              new User(newUser).save().then(result => {
                res.redirect('/login');
              }).catch(err => {
                console.log(err);
              })
            });
    
          })
        }
      });
    } else {
      res.render('signup',{error: "you must fill all options"})
    }
   
  });
  
  // post login
  router.post('/login', (req, res, next) => {
    if(!req.body.email || !req.body.password){
      return res.render('login',{error : "You have to fill all options"})
    }
    passport.authenticate('local', {
      successRedirect: '/product/all',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  });
  
  
  // logout
  router.get('/logout', (req, res) => {
    req.logout();// Passport exposes a logout() function on req (also aliased as logOut()) that can be called from any route handler which needs to terminate a login session. Invoking logout() will remove the req.user property and clear the login session (if any).
    res.redirect('/login');
    // req.flash('success_msg','You logged out successfully');
  })

module.exports = router