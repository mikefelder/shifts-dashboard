/**
 * SystemController – Unit Tests
 *
 * Covers T069: health and echo handler functions.
 * Uses mock request/response objects to test handlers in isolation.
 */

import { createSystemController } from '../system.controller';

// ============================================================================
// Helpers
// ============================================================================

function makeReq(overrides: Partial<{ body: Record<string, unknown> }> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as import('express').Request;
}

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response;
}

function runHandler(
  handler: (...args: any[]) => void,
  req: import('express').Request,
  res: import('express').Response,
  next = jest.fn()
) {
  handler(req, res, next);
}

// ============================================================================
// Tests
// ============================================================================

describe('SystemController', () => {
  const controller = createSystemController();

  describe('health', () => {
    it('responds with status 200', async () => {
      const req = makeReq();
      const res = makeRes();

      runHandler(controller.health, req, res);
      await Promise.resolve();
      await Promise.resolve();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns status ok in result', async () => {
      const req = makeReq();
      const res = makeRes();

      runHandler(controller.health, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.result.status).toBe('ok');
    });

    it('returns timestamp as ISO string', async () => {
      const req = makeReq();
      const res = makeRes();

      runHandler(controller.health, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(typeof payload.result.timestamp).toBe('string');
      // Should parse as a valid date
      expect(new Date(payload.result.timestamp).toISOString()).toBe(payload.result.timestamp);
    });

    it('returns uptime as a number', async () => {
      const req = makeReq();
      const res = makeRes();

      runHandler(controller.health, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(typeof payload.result.uptime).toBe('number');
    });

    it('includes timing metadata', async () => {
      const req = makeReq();
      const res = makeRes();

      runHandler(controller.health, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.timing).toBeDefined();
      expect(typeof payload.timing.duration_ms).toBe('number');
    });
  });

  describe('echo', () => {
    it('responds with status 200', async () => {
      const req = makeReq({ body: { message: 'hello' } });
      const res = makeRes();

      runHandler(controller.echo, req, res);
      await Promise.resolve();
      await Promise.resolve();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('echoes back the provided message', async () => {
      const req = makeReq({ body: { message: 'hello world' } });
      const res = makeRes();

      runHandler(controller.echo, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.result.echo).toBe('hello world');
    });

    it('defaults to "ping" when no message provided', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();

      runHandler(controller.echo, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.result.echo).toBe('ping');
    });

    it('includes timing metadata', async () => {
      const req = makeReq({ body: { message: 'test' } });
      const res = makeRes();

      runHandler(controller.echo, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.timing).toBeDefined();
      expect(typeof payload.timing.duration_ms).toBe('number');
    });

    it('coerces non-string message to string', async () => {
      const req = makeReq({ body: { message: 42 } });
      const res = makeRes();

      runHandler(controller.echo, req, res);
      await Promise.resolve();
      await Promise.resolve();

      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.result.echo).toBe('42');
    });
  });
});
