const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected Endpoints', function() {
  let db;

  const { testUsers, testThings, testReviews } = helpers.makeThingsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  beforeEach('insert things', () => {
    return helpers.seedThingsTables(db, testUsers, testThings, testReviews);
  });

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:things_id',
      path: '/api/things/1'
    },
    {
      name: 'GET /api/things/:things_id',
      path: '/api/things/1/reviews'
    }
  ];

  protectedEndpoints.forEach(endpoint => {
    
    describe(endpoint.name, () => {
      it('responds with 401 missing token when no basic token provided', () => {
        return supertest(app)
          .get(endpoint.path)
          .expect(401, { error: 'Missing token' });
      });

      it('responds with 401 "Unauthorized request" when Credentials are missing', () => {
        const missingCred = { user_name: '', password: '' };

        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(missingCred))
          .expect(401, { error: 'Unauthorized request' });
      });

      it("responds 401 if user isn't valid", () => {
        const invalidUser = { user_name: 'NotAReal', password: 'password' };

        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request' });
      });

      it("responds 401 Unauthorized request if password doesn't match user_name", () => {
        const invalidPassword = {
          user_name: testUsers[0].user_name,
          password: 'Notarealpassword'
        };

        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidPassword))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});