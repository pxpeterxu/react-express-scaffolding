// @flow
//
// If we want to mock any network responses, include
// this file and then within tests, do:
// mockAxios.mockReturnValue(...)
//
const mockAxios: any => Promise<any> = jest.fn();

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  mockAxios.create = axios.create;

  // The default export is a function, but
  // our test axiocist requires axios.create
  return mockAxios;
});

export default mockAxios;
