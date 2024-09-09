const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Group Chat Application', () => {
  before(async () => {
    await mongoose.connect('mongodb://localhost/group_chat_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  describe('User Management', () => {
    it('should create a new admin user', async () => {
      const res = await request(app)
        .post('/admin/create-user')
        .send({ username: 'admin', password: 'password', role: 'admin' });
      expect(res.status).to.equal(201);
      expect(res.text).to.equal('User created');
    });

    it('should login the admin user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });
  });

});
