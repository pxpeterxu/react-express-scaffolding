function allowCORSOptions(req, res) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
  }

  res.end();
}

function allowChromeCrossDomain(req, res, next) {
  if (req.headers.origin &&
      req.headers.origin.indexOf('chrome-extension://') === 0) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  next();
}

function allowAllCrossDomain(req, res, next) {
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  next();
}

const exported = {
  allowCORSOptions: allowCORSOptions,
  allowChromeCrossDomain: allowChromeCrossDomain,
  allowAllCrossDomain: allowAllCrossDomain
};

export default exported;
export { allowCORSOptions, allowChromeCrossDomain, allowAllCrossDomain };
