var express = require('express');
var bcrypt = require('bcryptjs');
var _ = require('lodash');
var randomstring = require('randomstring');
var passport = require('passport');

var User = require('./models/User');
var auth = require('./libs/auth');
var mail = require('./libs/mail');
var misc = require('./libs/misc');
var logger = require('./libs/logger');

var router = express.Router();

router.post('/register', function(req, res, next) {
  var bcryptRounds = 10;
  var password = _.isEmpty(req.body.password) ? null : req.body.password;
  // If password is null, it will be hashed as null too
  
  bcrypt.hash(password, bcryptRounds, function(err, hash) {
    var user = User.build({
      email: req.body.email,
      username: req.body.username,
      password: hash || '',
      activationKey: randomstring.generate(8)
    });
    
    user.validate().then(function(err) {
      if (err) {
        // Found a basic validation error; just respond
        throw misc.oneMessagePerField(err.errors);
      }
      
      // Do deeper validation
      return [
        User.findOne({
          where: { email: user.email }, attributes: ['id']
        }),
        User.findOne({
          where: { username: user.username }, attributes: ['id']
        })
      ];
    }).spread(function(existingEmail, existingUsername) {
      var messages = [];
      if (existingEmail) {
        messages.push('There already is a user with this email address; please sign in instead');
      } else if (existingUsername) {
        messages.push('This username is already taken; please pick another one');
      }
      
      if (messages.length !== 0) {
        throw messages;
      }
      
      return user.save();
    }).then(function(user) {
      mail.send(user.email, 'confirm', {
        username: user.username,
        activationKey: user.activationKey
      }, function(err, info) {
        // TODO: this should never happen
        logger.error('Mail send failed', {err: err, info: info});
      });
        
      res.json({
        success: true,
        messages: ['You have successfully signed up! We have sent an activation email to your email address']
      });
    }).catch(function(messages) {
      res.json({
        success: false,
        messages: messages
      });
    });
  });
});


router.post('/login', function(req, res, next) {
  passport.authenticate('local', {
    badRequestMessage: 'Please enter your email/username and password'
  }, function(err, user, info) {
    if (user) {    
      req.logIn(user, function(err) {
        if (err) {
          res.json({
            success: false,
            messages: ['An unknown error occured']
          });
          logger.error('Login failed', {err: err});
        }
        
        res.json({
          success: true,
          messages: ['You have successfully signed in'],
          username: user.username
        });
      });
    } else {
      res.json({
        success: false,
        messages: [info.message]
      });
    }
  })(req, res, next);
});


router.post('/logout', function(req, res) {
  req.logout();
  var successResponse = {
    success: true,
    messages: ['You are now signed out']
  };
  
  res.json(successResponse);
});

router.post('/activate/:username/:activationKey', function(req, res, next) {
  User.findOne({
    where: { username: req.params.username },
    attributes: ['id', 'username', 'activated', 'activationKey']
  }).then(function(user) {
    if (!user) {
      res.json({
        success: false,
        messages: ['We could not find the given user; please make sure you followed the link emailed to you exactly'],
        errType: 'userNotFound'
      });
      return;
    }
    
    if (user.activationKey !== req.params.activationKey) {
      res.json({
        success: false,
        messages: ['The activation key is incorrect; please make sure you followed the link emailed to you exactly'],
        errType: 'wrongActivationKey'
      });
      return;
    }
    
    user.activated = true;
    user.save().then(function() {
      res.json({
        success: true,
        messages: ['Your account has been activated']
      });
    });
  });
});

router.get('/isLoggedin', function(req, res) {
	res.json({
		success: true,
		loggedIn: !!req.user,
    username: req.user ? req.user.username : null
	});
});

module.exports = router;
