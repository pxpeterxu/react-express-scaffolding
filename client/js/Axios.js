import axios from 'axios';

// Plugs axios to act like request-promise and return the
// data on success rather than an object with the data in response.data
export default function(options) {
  return axios(options).then(function(response) {
    return response.data;
  });
};
