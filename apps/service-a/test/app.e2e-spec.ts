import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as path from 'path';

describe('Service-A API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AppController', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('PublicApiController', () => {
    it('/public-api/fetch (GET) - should fetch data from external API', () => {
      return request(app.getHttpServer())
        .get('/public-api/fetch')
        .query({ url: 'https://jsonplaceholder.typicode.com/posts/1' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.filename).toBeDefined();
        });
    });

    it('/public-api/fetch (GET) - should return 400 if url is not provided', () => {
      return request(app.getHttpServer())
        .get('/public-api/fetch')
        .expect(400);
    });

    it('/public-api/download (GET) - should download a file', () => {
      // First fetch to get a filename
      return request(app.getHttpServer())
        .get('/public-api/fetch')
        .query({ url: 'https://jsonplaceholder.typicode.com/posts/1' })
        .expect(200)
        .then((fetchRes) => {
          const filename = fetchRes.body.filename;

          // Then test download
          return request(app.getHttpServer())
            .get('/public-api/download')
            .query({ filename })
            .expect(200)
            .expect('Content-Type', /json/);
        });
    });

    it('/public-api/download (GET) - should return 400 if filename is not provided', () => {
      return request(app.getHttpServer())
        .get('/public-api/download')
        .expect(400);
    });
  });

  describe('SearchController', () => {
    it('/search (POST) - should search in a collection', () => {
      return request(app.getHttpServer())
        .post('/search')
        .query({ collection: 'test' })
        .send({
          query: { title: { $regex: 'test', $options: 'i' } },
          pagination: { page: 1, limit: 10 }
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            items: expect.any(Array),
            limit: 10,
            page: 1,
            total: expect.any(Number),
          })
        });
    });

    it('/search (POST) - should return 400 if collection is not provided', () => {
      return request(app.getHttpServer())
        .post('/search')
        .send({ query: {} })
        .expect(400);
    });
  });

  describe('UploadController', () => {
    it('/upload (POST) - should upload a file', () => {
      const testFilePath = path.join(__dirname, '../data/data_2025-03-01T11-58-34.714Z.json');

      return request(app.getHttpServer())
        .post('/upload')
        .attach('file', testFilePath)
        .field('collection', 'test_collection')
        .expect(201)
        .expect((res) => {
          expect(res.body.collection).toEqual('test_collection');
          expect(res.body.filename).toMatch(/data_2025-03-01T11-58-34.714Z.json/);
          expect(res.body.documentsInserted).toBeGreaterThan(0);
        });
    });

    it('/upload (POST) - should return 400 if file is not provided', () => {
      return request(app.getHttpServer())
        .post('/upload')
        .field('collection', 'test_collection')
        .expect(400);
    });

    it('/upload (POST) - should return 400 if collection is not provided', () => {
      const testFilePath = path.join(__dirname, '../data/data_2025-03-01T11-58-34.714Z.json');

      return request(app.getHttpServer())
        .post('/upload')
        .attach('file', testFilePath)
        .expect(400);
    });
  });
});
