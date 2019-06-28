const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const config = require('../src/config');

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

  beforeEach('insert things', () =>
    helpers.seedThingsTables(db, testUsers, testThings, testReviews)
  );

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:things_id',
      path: '/api/things/1'
    },
    {
      name: 'GET /api/things/:things_id/reviews',
      path: '/api/things/1/reviews'
    }
  ];

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it('responds with 401 missing token when no bearer token provided', () => {
        return supertest(app)
          .get(endpoint.path)
          .expect(401, { error: 'Missing bearer token' });
      });

      it('responds with 401 "Unauthorized request" when JWT secret is invalid', () => {
        const testUser = testUsers[0];

        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(testUser, 'fakesecret'))
          .expect(401, { error: 'Unauthorized request' });
      });

      it("responds 401 if subject isn't valid", () => {
        const invalidUser = { user_name: 'NotAReal', id: 1 };

        return supertest(app)
          .get(endpoint.path)
          .set(
            'Authorization',
            helpers.makeAuthHeader(invalidUser, config.JWT_SECRET)
          )
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
  describe('POST /api/reviews', () => {
    const endpoint = { path: '/api/reviews' };
    const { testThings, testUsers } = helpers.makeThingsFixtures();
    const newReview = {
      text: 'Test new review',
      rating: 3,
      thing_id: testThings[0].id
    };

    it('responds with 401 missing token when no bearer token provided', () => {
      return supertest(app)
        .post(endpoint.path)
        .send(newReview)
        .expect(401, { error: 'Missing bearer token' });
    });

    it('responds with 401 "Unauthorized request" when JWT secret is invalid', () => {
      const testUser = testUsers[0];

      return supertest(app)
        .post(endpoint.path)
        .send(newReview)
        .set('Authorization', helpers.makeAuthHeader(testUser, 'fakesecret'))
        .expect(401, { error: 'Unauthorized request' });
    });

    it("responds 401 if subject isn't valid", () => {
      const invalidUser = { user_name: 'NotAReal', id: 1 };

      return supertest(app)
        .post(endpoint.path)
        .send(newReview)
        .set(
          'Authorization',
          helpers.makeAuthHeader(invalidUser, config.JWT_SECRET)
        )
        .expect(401, { error: 'Unauthorized request' });
    });
  });
});