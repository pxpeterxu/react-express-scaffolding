// @flow

//
// Database/server-reliant tests have the annoying property that
// generally, the server’s suppose to stay up after all requests,
// so we manually end the process after all tests
//
afterAll(() => {
  setTimeout(() => {
    process.exit();
  }, 100);
});
