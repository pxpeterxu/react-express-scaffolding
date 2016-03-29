var express = require('express');

var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
  // Just send the React-based index
});

module.exports = router;
