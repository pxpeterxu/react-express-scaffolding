var express = require('express');
var _ = require('lodash');
var randomstring = require('randomstring');
var passport = require('passport');

var User = require('./models/User');
var PasswordResetToken = require('./models/PasswordResetToken');
var auth = require('./libs/auth');
var cors = require('./libs/cors');
var mail = require('./libs/mail');
var misc = require('./libs/misc');
var logger = require('./libs/logger');

var router = express.Router();

router.options('/register', cors.allowCORSOptions);
router.post('/register', function(req, res, next) {
  var password = _.isEmpty(req.body.password) ? null : req.body.password;
  // If password is null, it will be hashed as null too
  
  var user = null;
  User.hashPassword(password).then(function(hash) {
    user = User.build({
      email: req.body.email,
      username: req.body.username,
      password: hash || '',
      activationKey: randomstring.generate(8)
    });
    
    return user.validate();
  }).then(function(err) {
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
    var errors = [];
    if (existingEmail) {
      errors.push({
        message: 'There already is a user with this email address; please sign in instead',
        type: 'emailExists'
      });
    }
    if (existingUsername) {
      errors.push({
        message: 'This username is already taken; please pick another one',
        type: 'usernameExists'
      });
    }
    
    if (errors.length !== 0) {
      throw new misc.ApplicationError(errors);
    }
    
    // Activation disabled
    user.activated = true;
    
    return user.save();
  }).then(function(dbUser) {
    user = dbUser;
    // Activation disabled
    // return mail.send(user.email, 'confirm', {
      // username: user.username,
      // activationKey: user.activationKey
    // }
    return Promise.resolve(true).then(function(info) {        
      res.json({
        success: true,
        messages: ['You have successfully signed up! Sign in now with your email and password.']
        //messages: ['You have successfully signed up! We have sent an activation email to your email address. Activate your account, then log in to start using it.']
      });
    }).catch(function(err) {
      // This should not happen in regular operation
      logger.error('Mail send failed', { err: err });
      
      // Activate it automatically; it's not their fault
      user.activated = true;
      user.save().then(function(dbUser) {
        res.json({
          success: true,
          messages: ['You have successfully signed up! We have automatically activated your account because our email systems are currently not working.']
        });
      });
    });
  }).catch(misc.defaultCatch(res));
});


router.options('/login', cors.allowCORSOptions);
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
          return;
        }
        
        res.json({
          success: true,
          loggedIn: true,
          messages: ['You have successfully signed in'],
          username: user.username,
          activated: user.activated
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


router.options('/logout', cors.allowCORSOptions);
router.post('/logout', function(req, res) {
  req.logout();
  var successResponse = {
    success: true,
    messages: ['You are now signed out']
  };
  
  res.json(successResponse);
});

router.options('/activate/:username/:activationKey', cors.allowCORSOptions);
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


router.options('/startResetPassword', cors.allowCORSOptions);
router.post('/startResetPassword', function(req, res, next) {
  var email = req.body.email;
  var username = req.body.username;
  
  var errors = [];
  if (!email) {
    errors.push({ message: 'Please enter the account\'s email', type: 'emptyEmail' });
  }
  if (!username) {
    errors.push({ message: 'Please enter the account\'s username', type: 'emptyUsername' });
  }
  var user = null;  // Used to globalize scope across promises
  
  User.findOne({
    where: {
      username: username,
      email: email
    },
    attributes: ['id', 'username', 'email']
  }).then(function(dbUser) {
    user = dbUser;
    if (!user) {
      throw new misc.ApplicationError([{
        message: 'We could not find a matching user; please check the entered email and username',
        type: 'userNotFound'
      }]);
      return;
    }
    
    return PasswordResetToken.create({
      userId: user.id,
      token: randomstring.generate(32)
    });
  }).then(function(token) {
    return mail.send(user.email, 'resetPassword', {
      username: user.username,
      token: token.token
    }).then(function(info) {
      res.json({
        success: true,
        messages: ['We have sent an email to reset your password! Please check your inbox at ' + user.email]
      });
    }).catch(function(err) {
      logger.error('Mail send failed for password request', { err: err });
      throw new misc.ApplicationError([{
        message: 'We could send the recovery email. Please try again later',
        type: 'resetEmailSendFailed'
      }]);
    });
  }).catch(misc.defaultCatch(res));
});

/**
 * Middleware for checking the length of passwords in req.body
 * used for password changes and resets
 */
var checkPasswordLength = function(req, res, next) {
  var password = req.body.password;
  
  if (!password || password.length < 6) {
    res.json({
      success: false,
      messages: ['Please enter a non-empty new password of at least 6 letters'],
      errTypes: ['shortPassword']
    });
    return;
  }
  
  next();
};

/**
 * Change a user's password by hashing and setting it
 * @param user      sequelize user object
 * @param password  string of new password to set
 * @return Promise.<User>
 */
var changePassword = function(user, password) {
  return User.hashPassword(password).then(function(hash) {
    user.password = hash;
    return user.save();
  });
};

router.options('/resetPassword', cors.allowCORSOptions);
router.post('/resetPassword', checkPasswordLength, function(req, res, next) {
  var password = req.body.password;
  // Assured to be non-empty by checkPasswordLength
  
  // 1. Check that we have the right token to change the password
  var user = null;
  var token = null;
  PasswordResetToken.findOne({
    where: { token: req.body.token },
    attributes: ['id', 'createdAt'],
    include: {
      model: User,
      attributes: ['id', 'password']
    }
  }).then(function(dbToken) {
    token = dbToken;
    if (!token) {
      throw new misc.ApplicationError([{
        message: 'We could not find the matching password reset token',
        type: 'badPasswordToken'
      }]);
    }
    
    var timeSinceCreation = Date.now() - token.createdAt;
    if (timeSinceCreation > 86400 * 1000) {
      throw new misc.ApplicationError([{
        message: 'This password reset token has expired. Please request another one by going to the Sign In page',
        type: 'expiredPasswordToken'
      }]);
    }
    
    // 2. Actually change the user's password
    return changePassword(token.User, password);
  }).then(function(dbUser) {
    // 3. Invalidate the token
    return token.destroy();
  }).then(function() {
    res.json({
      success: true,
      messages: ['Your password has been updated. You can now log in using the new password']
    });
  }).catch(misc.defaultCatch(res));
});


// Check if password reset token is valid
router.get('/isValidPasswordResetToken', function(req, res) {
  if (!req.query.token) {
    res.json({
      success: true,
      isValid: false
    });
    return;
  }
  
  PasswordResetToken.findOne({ where: { token: req.query.token }, attributes: ['id'] }).then(function(token) {
    res.json({
      success: true,
      isValid: !!token
    });
  }).catch(misc.defaultCatch(res));
});


router.options('/changePassword', cors.allowCORSOptions);
router.post('/changePassword', auth.loginCheck,
    checkPasswordLength, function(req, res, next) {
  var password = req.body.password;
    // Verified to be not empty by checkPasswordLength
  var curPassword = req.body.curPassword;
  
  if (!curPassword) {
    res.json({
      success: false,
      messages: ['Please enter your current password'],
      errTypes: ['curPasswordMissing']
    });
  }
  
  var user = null;
  
  User.findById(req.user.id, { attributes: ['id', 'password'] }).then(function(dbUser) {
    user = dbUser;
    
    return user.comparePassword(curPassword);
  }).then(function(matched) {
    if (!matched) {
      throw new misc.ApplicationError([{ message: 'Your current password did not match', type: 'wrongCurPassword' }]);
    }
    
    return changePassword(user, password);
  }).then(function(dbUser) {
    res.json({
      success: true,
      messages: ['Your password has been changed']
    });
  }).catch(misc.defaultCatch(res));
});


router.get('/isLoggedin', function(req, res) {
	res.json({
		success: true,
		loggedIn: !!req.user,
    username: req.user ? req.user.username : null,
    activated: req.user ? req.user.activated : null
	});
});

module.exports = router;
