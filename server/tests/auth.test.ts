import { authenticate, authorize } from '../src/middleware/auth';
import { jest } from '@jest/globals';

const createRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res.body = payload; return res; };
  return res;
};

describe('auth middleware', () => {
  test('authenticate returns 401 when no token', async () => {
    const req: any = { header: () => undefined };
    const res = createRes();
    const next = jest.fn();
    await authenticate(req, res as any, next as any);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Access denied/);
    expect(next).not.toHaveBeenCalled();
  });

  test('authorize returns 403 for insufficient role', () => {
    const req: any = { user: { role: 'USER' } };
    const res = createRes();
    const next = jest.fn();
    authorize('ADMIN')(req, res as any, next as any);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/);
    expect(next).not.toHaveBeenCalled();
  });
});