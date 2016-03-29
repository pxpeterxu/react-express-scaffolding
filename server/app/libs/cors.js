var allowCORSOptions = function(req, res) {
  var headers = {};
  res.header('Access-Control-Allow-Origin', req.headers['origin']);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
  }
  
  res.end();
};

module.exports = {
  allowCORSOptions: allowCORSOptions
};
