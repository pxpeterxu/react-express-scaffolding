import express from 'express';
import _ from 'lodash';
import moment from 'moment';
import randomstring from 'randomstring';
import passport from 'passport';
import Promise from 'es6-promise';

import User from './models/User';
import PasswordResetToken from './models/PasswordResetToken';

import auth from './libs/auth';
import cors from './libs/cors';
import mail from './libs/mail';
import misc from './libs/misc';
import logger from './libs/logger';
import config from './config';

let router = express.Router();

/**
 * Log in using Passport.js; since they use a callback,
 * make a promisified version
 * @param req           Express.js request object
 * @param user          user to log in with
 * @return Promise.<token>
 */
function login(req, user) {
  return new Promise(function(resolve, reject) {
    req.logIn(user, function(err) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  }).then(function() {
    user.lastLoggedInAt = moment();
    return user.save();
  }).then(function() {
    return null;
  });
}

/**
 * Middleware for checking the length of passwords in req.body
 * used for password changes and resets
 */
function checkPasswordLength(req, res, next) {
  let password = req.body.password;

  if (!password || password.length < 6) {
    res.json({
      success: false,
      messages: ['Please enter a non-empty new password of at least 6 letters'],
      errTypes: ['shortPassword']
    });
    return;
  }

  next();
}

router.options('/register', cors.allowCORSOptions);
router.post('/register', checkPasswordLength, function(req, res) {
  let password = _.isEmpty(req.body.password) ? null : req.body.password;
  // If password is null, it will be hashed as null too

  let email = req.body.email;
  if (config.signupEmailDomain && !(new RegExp(config.signupEmailDomain + '$', 'i')).test(email)) {
    res.json({
      success: false,
      messages: ['You are not allowed to sign up with this email account']
    });
    return;
  }

  let user = null;
  let successMessage;
  User.hashPassword(password).then(function(hash) {
    user = User.build({
      email: req.body.email,
      username: req.body.username,
      name: req.body.name,
      password: hash,
      activationKey: randomstring.generate(8)
    });

    return user.validate();
  }).then(function(err) {
    if (err) {
      // Found a basic validation error; just respond
      throw new misc.ResponseError({
        messages: misc.oneMessagePerField(err.errors)
      });
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
    let errors = [];
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
      throw new misc.WAError(errors);
    }

    return user.save();
  }).then(function(dbUser) {
    user = dbUser;

    // Create a default API key to lower friction
    return APIKey.create({
      username: user.username,
      key: randomstring.generate(32),
      type: 'server'
    });
  }).then(function() {
    return mail.send(user.email, 'confirm', {
      username: user.username,
      activationKey: user.activationKey
    }).then(function() {
      return 'You have successfully signed up! We have sent an activation email to your email address. In the meantime, you can start building APIs without activating.';
    }).catch(function(err) {
      // This should not happen in regular operation
      logger.error('Mail send failed', { err: err });

      // Activate it automatically; it's not their fault
      user.activated = true;
      return user.save().then(function() {
        return 'You have successfully signed up! We have automatically activated your account because our email systems are currently not working.';
      });
    });
  }).then(function(message) {
    successMessage = message;

    // Immediately log in if possible
    return login(req, user, true).then(function() {
      res.json(_.assign({
        messages: [successMessage],
      }, auth.getUserOutput(user, req.session)));
    }).catch(function(err) {
      console.error(err);
      res.json({
        success: true,
        loggedIn: false,
        messages: [successMessage, 'Please log in with your newly-created account to get started.']
      });
      logger.error('Login failed', { err: err });
    });
  }).catch(misc.defaultCatch(res));
});


router.options('/login', cors.allowCORSOptions);
router.post('/login', function(req, res, next) {
  passport.authenticate('local', {
    badRequestMessage: 'Please enter your email/username and password'
  }, function(err, user, info) {
    if (user) {
      login(req, user).then(function() {
        res.json(_.assign({
          messages: ['You have successfully signed in'],
        }, auth.getUserOutput(user, req.session)));
      }).catch(function(err) {
        res.json({
          success: false,
          messages: ['An unknown error occured']
        });
        logger.error('Login failed', { err: err });
      });
    } else {
      res.json({
        success: false,
        messages: [info.message]
      });
    }
  })(req, res, next);
});

/**
 * Login as a given user
 */
router.get('/loginAs/:username', function(req, res) {
  if (!req.user || req.user.role !== 'Administrator') {
    res.json({
      success: false,
      messages: ['Invalid request'],
      errTypes: ['invalidRequest']
    });
    return;
  }

  let username = req.params.username;
  User.findOne({
    where: {
      $or: [
        { username: username },
        { email: username }
      ]
    }
  }).then(function(user) {
    if (!user) {
      throw new misc.WAError([{
        message: 'We could not find a matching user',
        type: 'userNotFound'
      }]);
    }

    req.logout();
    return login(req, user, false);
  }).then(function() {
    res.json({
      success: true,
      messages: ['We have logged you in as the user given']
    });
  }).catch(misc.defaultCatch(res));
});

router.options('/logout', cors.allowCORSOptions);
router.post('/logout', function(req, res) {
  req.logout();
  let successResponse = {
    success: true,
    messages: ['You are now signed out']
  };

  res.json(successResponse);
});

router.options('/activate/:username/:activationKey', cors.allowCORSOptions);
router.post('/activate/:username/:activationKey', function(req, res) {
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
router.post('/startResetPassword', function(req, res) {
  let email = req.body.email;
  let username = req.body.username;

  let errors = [];
  if (!email) {
    errors.push({ message: 'Please enter the account\'s email', type: 'emptyEmail' });
  }
  if (!username) {
    errors.push({ message: 'Please enter the account\'s username', type: 'emptyUsername' });
  }
  let user = null;  // Used to globalize scope across promises

  User.findOne({
    where: {
      username: username,
      email: email
    },
    attributes: ['id', 'username', 'email']
  }).then(function(dbUser) {
    user = dbUser;
    if (!user) {
      throw new misc.WAError([{
        message: 'We could not find a matching user; please check the entered email and username',
        type: 'userNotFound'
      }]);
    }

    return PasswordResetToken.create({
      userId: user.id,
      token: randomstring.generate(32)
    });
  }).then(function(token) {
    return mail.send(user.email, 'resetPassword', {
      username: user.username,
      token: token.token
    }).then(function() {
      res.json({
        success: true,
        messages: ['We have sent an email to reset your password! Please check your inbox at ' + user.email]
      });
    }).catch(function(err) {
      logger.error('Mail send failed for password request', { err: err });
      throw new misc.WAError([{
        message: 'We could send the recovery email. Please try again later',
        type: 'resetEmailSendFailed'
      }]);
    });
  }).catch(misc.defaultCatch(res));
});

/**
 * Change a user's password by hashing and setting it
 * @param user      sequelize user object
 * @param password  string of new password to set
 * @return Promise.<User>
 */
function changePassword(user, password) {
  return User.hashPassword(password).then(function(hash) {
    user.password = hash;
    return user.save();
  });
};

router.options('/resetPassword', cors.allowCORSOptions);
router.post('/resetPassword', checkPasswordLength, function(req, res) {
  let password = req.body.password;
  // Assured to be non-empty by checkPasswordLength

  // 1. Check that we have the right token to change the password
  let token = null;
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
      throw new misc.WAError([{
        message: 'We could not find the matching password reset token',
        type: 'badPasswordToken'
      }]);
    }

    let timeSinceCreation = Date.now() - token.createdAt;
    if (timeSinceCreation > 86400 * 1000) {
      throw new misc.WAError([{
        message: 'This password reset token has expired. Please request another one by going to the Sign In page',
        type: 'expiredPasswordToken'
      }]);
    }

    // 2. Actually change the user's password
    return changePassword(token.User, password);
  }).then(function() {
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
    checkPasswordLength, function(req, res) {
  /* eslint-disable indent */

  let password = req.body.password;
    // Verified to be not empty by checkPasswordLength
  let curPassword = req.body.curPassword;

  if (!curPassword) {
    res.json({
      success: false,
      messages: ['Please enter your current password'],
      errTypes: ['curPasswordMissing']
    });
  }

  let user = null;

  User.findById(req.user.id, { attributes: ['id', 'password'] }).then(function(dbUser) {
    user = dbUser;

    return user.comparePassword(curPassword);
  }).then(function(matched) {
    if (!matched) {
      throw new misc.WAError([{ message: 'Your current password did not match', type: 'wrongCurPassword' }]);
    }

    return changePassword(user, password);
  }).then(function() {  // function(dbUser)
    res.json({
      success: true,
      messages: ['Your password has been changed']
    });
  }).catch(misc.defaultCatch(res));
});

router.options('/tutorialStep', cors.allowCORSOptions);
router.post('/tutorialStep', auth.loginCheck, function(req, res) {
  let step = req.body.step;

  let user = req.user;
  user.tutorialStep = step;
  user.save().then(function(user) {
    res.json(_.assign({
      messages: ['Updated the current tutorial step to step ' + step]
    }, auth.getUserOutput(user, req.session)));
  }).catch(misc.defaultCatch(res));
});

router.get('/isLoggedin', function(req, res) {
  res.json(auth.getUserOutput(req.user, req.session));
});

export default router;
