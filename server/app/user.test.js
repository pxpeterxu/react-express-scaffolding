// @flow
import axios from '../../tests/Axios';

describe('/user', () => {
  describe('/register', () => {
    it('should successfully register a new user', () => {
      return axios({
        url: '/user/register',
        method: 'POST',
        data: {
          email: 'peter@myrtlelime.com',
          username: 'test',
          password: 'This is a fake password',
          company: '',
        },
      }).then(res => {
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.isLoggedIn).toBe(true);
        expect(res.data.username).toBe('test');
        expect(res.data.email).toBe('peter@myrtlelime.com');
      });
    });
  });
});
