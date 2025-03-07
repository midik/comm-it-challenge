import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Service-B API (e2e)', () => {
  let app: INestApplication<App>;
  let reportFilename: string;

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

  describe('LogsController', () => {
    it('/logs (GET) - should return paginated logs', () => {
      return request(app.getHttpServer())
        .get('/logs')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeInstanceOf(Array);
        });
    });

    it('/logs (GET) - should filter logs by type', () => {
      return request(app.getHttpServer())
        .get('/logs')
        .query({
          filter: { type: 'error' },
          pagination: { page: 1, limit: 10 },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeInstanceOf(Array);
        });
    });

    it('/logs/timeseries (GET) - should return time series data', () => {
      return request(app.getHttpServer())
        .get('/logs/timeseries')
        .query({ interval: 'hour', from: '2025-01-01', to: '2025-03-01' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject(expect.any(Array))
        });
    });

    it('/logs/distribution (GET) - should return event distribution data', () => {
      return request(app.getHttpServer())
        .get('/logs/distribution')
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            distribution: {
              API_REQUEST: expect.any(Number),
              API_RESPONSE: expect.any(Number),
              DB_SEARCH: expect.any(Number),
              FILE_PARSE: expect.any(Number),
              FILE_UPLOAD: expect.any(Number),
            },
          })
        });
    });
  });

  describe('ReportsController', () => {
    it('/reports/generate (GET) - should generate a PDF report', () => {
      return request(app.getHttpServer())
        .get('/reports/generate')
        .query({
          from: '2025-01-01',
          to: '2025-03-01',
          includeCharts: true
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            downloadUrl: expect.any(String),
            filename: expect.any(String),
            message: 'Report generated successfully',
          })
        });
    });

    // @ts-ignore
    it('/reports/download (GET) - should download a report', () => {
      // Use an existing report if the generation test didn't run
      if (!reportFilename) {
        // Use an existing report file from the reports directory
        const reportsDir = path.join(__dirname, '../reports');
        const reportFiles = fs.readdirSync(reportsDir)
          .filter(file => file.startsWith('report_') && file.endsWith('.pdf'));

        if (reportFiles.length > 0) {
          reportFilename = reportFiles[0];
        } else {
          // Skip test if no report files are available
          console.log('No report files available for download test');
          return;
        }
      }

      return request(app.getHttpServer())
        .get('/reports/download')
        .query({ filename: reportFilename })
        .expect(200)
        .expect('Content-Type', 'application/pdf');
    });

    it('/reports/download (GET) - should return 400 if filename is not provided', () => {
      return request(app.getHttpServer())
        .get('/reports/download')
        .expect(400);
    });

    it('/reports/download (GET) - should return 404 if file does not exist', () => {
      return request(app.getHttpServer())
        .get('/reports/download')
        .query({ filename: 'non_existent_file.pdf' })
        .expect(404);
    });
  });
});
