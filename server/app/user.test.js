// @flow
import supertest from 'supertest';
import bodyParser from 'body-parser';
import app from '../app';

app.use(bodyParser.json());

describe('/user', () => {
  describe('/register', () => {
    it('should successfully register a new user', () => {
      return supertest(app)
        .post('/user/register')
        .send({
          email: 'peter@myrtlelime.com',
          username: 'test',
          password: 'This is a fake password',
          company: '',
        })
        .then(res => {
          expect(res.statusCode).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.isLoggedIn).toBe(true);
          expect(res.body.username).toBe('test');
          expect(res.body.email).toBe('peter@myrtlelime.com');
        });
    });
  });
});
