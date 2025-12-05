import cors from 'cors';
import express from 'express';
import request, { Response } from 'supertest';
import { buildCorsOptions } from '../../src/core/cors';
import { CorsConfig } from '../../src/types';

function createApp(config?: CorsConfig) {
  const app = express();
  const options = buildCorsOptions(config);
  if (options) {
    app.use(cors(options));
  }
  app.get('/test', (_req, res) => res.send('ok'));
  return app;
}

describe('CORS configuration', () => {
  it('applies string origin with credentials', async () => {
    const app = createApp({ origin: 'https://example.com', credentials: true });

    await request(app)
      .get('/test')
      .set('Origin', 'https://example.com')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://example.com')
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  it('accepts array of origins', async () => {
    const app = createApp({
      origin: ['https://one.com', 'https://two.com'],
      credentials: true
    });

    await request(app)
      .get('/test')
      .set('Origin', 'https://two.com')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://two.com');

    await request(app)
      .get('/test')
      .set('Origin', 'https://unknown.com')
      .expect(200)
      .expect((res: Response) => {
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('defaults to reflecting origin when credentials are true and origin is not set', async () => {
    const app = createApp({ credentials: true });

    await request(app)
      .get('/test')
      .set('Origin', 'https://reflected.com')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://reflected.com')
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  it('sets default methods and custom allowed headers on preflight', async () => {
    const app = createApp({
      origin: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    });

    await request(app)
      .options('/test')
      .set('Origin', 'https://any.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
      .expect(204)
      .expect('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
      .expect('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  });
});
