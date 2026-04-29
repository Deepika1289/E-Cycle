import { errorHandler } from '../src/middleware/errorHandler';
import { AppError } from '../src/utils/AppError';

const createRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res.body = payload; return res; };
  return res;
};

describe('errorHandler', () => {
  test('handles AppError with provided status', () => {
    const err = new AppError('Bad Request', 400);
    const res = createRes();
    errorHandler(err as any, {} as any, res as any, (() => {}) as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Bad Request' });
  });

  test('handles ValidationError', () => {
    const err: any = new Error('validation');
    err.name = 'ValidationError';
    err.errors = { field: { message: 'field is invalid' } };
    const res = createRes();
    errorHandler(err as any, {} as any, res as any, (() => {}) as any);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation Error');
  });

  test('handles duplicate key error', () => {
    const err: any = new Error('dup');
    err.code = 11000;
    err.keyPattern = { email: 1 };
    const res = createRes();
    errorHandler(err as any, {} as any, res as any, (() => {}) as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Duplicate field value', field: 'email' });
  });

  test('default 500 for unhandled errors', () => {
    const err = new Error('boom');
    const res = createRes();
    errorHandler(err as any, {} as any, res as any, (() => {}) as any);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});