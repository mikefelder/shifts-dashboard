/**
 * AccountController – Unit Tests
 *
 * Covers T050: list, self, byWorkgroup, byId handler functions.
 * Uses mock request/response objects to test handlers in isolation.
 */

import { createAccountController } from '../account.controller';
import type { AccountResult, SingleAccountResult } from '../../services/account.service';
import type { ShiftboardAccount } from '../../services/shiftboard.service';

// ============================================================================
// Helpers
// ============================================================================

function makeReq(
  overrides: Partial<{
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
  }> = {}
) {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as Partial<import('express').Request> as import('express').Request;
}

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response;
}

/**
 * Run the LAST handler in the array (the asyncHandler-wrapped business logic).
 * Middleware validators are the earlier entries.
 */
function runLastHandler(
  handlers: Array<any>,
  req: import('express').Request,
  res: import('express').Response,
  next = jest.fn()
) {
  const handler = handlers.at(-1)!;
  handler(req, res, next);
}

// ============================================================================
// Fixtures
// ============================================================================

function makeAccount(overrides: Partial<ShiftboardAccount> = {}): ShiftboardAccount {
  return {
    id: 'acc-1',
    first_name: 'Alice',
    last_name: 'Smith',
    screen_name: 'ASmith',
    email: 'alice@example.com',
    mobile_phone: '555-1234',
    clocked_in: false,
    ...overrides,
  };
}

const mockListResult: AccountResult = {
  accounts: [makeAccount({ id: 'acc-1' }), makeAccount({ id: 'acc-2', last_name: 'Jones' })],
  total: 2,
};

const mockSingleResult: SingleAccountResult = {
  account: makeAccount({ id: 'acc-1' }),
};

// ============================================================================
// Mock Service Factory
// ============================================================================

function makeMockService(
  overrides: Partial<{
    listAccounts: jest.Mock;
    getSelf: jest.Mock;
    getByWorkgroup: jest.Mock;
    getById: jest.Mock;
  }> = {}
) {
  return {
    listAccounts: jest.fn().mockResolvedValue(mockListResult),
    getSelf: jest.fn().mockResolvedValue(mockSingleResult),
    getByWorkgroup: jest.fn().mockResolvedValue(mockListResult),
    getById: jest.fn().mockResolvedValue(mockSingleResult),
    ...overrides,
  };
}

// ============================================================================
// Tests: list
// ============================================================================

describe('AccountController.list', () => {
  it('responds 200 with accounts and total', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.list, makeReq(), res);
    await Promise.resolve();
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.result?.accounts).toHaveLength(2);
    expect(json?.result?.total).toBe(2);
  });

  it('includes timing metadata with non-negative duration', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.list, makeReq(), res);
    await Promise.resolve();

    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.timing?.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('propagates service errors to next()', async () => {
    const service = makeMockService({
      listAccounts: jest.fn().mockRejectedValue(new Error('DB failure')),
    });
    const controller = createAccountController(service as any);
    const next = jest.fn();

    runLastHandler(controller.list, makeReq(), makeRes(), next);
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ============================================================================
// Tests: self
// ============================================================================

describe('AccountController.self', () => {
  it('responds 200 with a single account', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.self, makeReq(), res);
    await Promise.resolve();
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.result?.account?.id).toBe('acc-1');
  });

  it('propagates service errors to next()', async () => {
    const service = makeMockService({
      getSelf: jest.fn().mockRejectedValue(new Error('Auth failed')),
    });
    const controller = createAccountController(service as any);
    const next = jest.fn();

    runLastHandler(controller.self, makeReq(), makeRes(), next);
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ============================================================================
// Tests: byWorkgroup
// ============================================================================

describe('AccountController.byWorkgroup', () => {
  it('responds 200 with accounts for the workgroup', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.byWorkgroup, makeReq({ params: { workgroupId: 'wg-1' } }), res);
    await Promise.resolve();
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.result?.workgroupId).toBe('wg-1');
    expect(json?.result?.total).toBe(2);
  });

  it('propagates service errors to next()', async () => {
    const service = makeMockService({
      getByWorkgroup: jest.fn().mockRejectedValue(new Error('WG not found')),
    });
    const controller = createAccountController(service as any);
    const next = jest.fn();

    runLastHandler(
      controller.byWorkgroup,
      makeReq({ params: { workgroupId: 'wg-bad' } }),
      makeRes(),
      next
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ============================================================================
// Tests: byId
// ============================================================================

describe('AccountController.byId', () => {
  it('responds 200 with a single account', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.byId, makeReq({ params: { accountId: 'acc-1' } }), res);
    await Promise.resolve();
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.result?.account?.id).toBe('acc-1');
  });

  it('includes timing metadata with non-negative duration', async () => {
    const service = makeMockService();
    const controller = createAccountController(service as any);
    const res = makeRes();

    runLastHandler(controller.byId, makeReq({ params: { accountId: 'acc-1' } }), res);
    await Promise.resolve();

    const json = (res.json as jest.Mock).mock.calls[0]?.[0];
    expect(json?.timing?.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('propagates service errors to next()', async () => {
    const service = makeMockService({
      getById: jest.fn().mockRejectedValue(new Error('Not found')),
    });
    const controller = createAccountController(service as any);
    const next = jest.fn();

    runLastHandler(controller.byId, makeReq({ params: { accountId: 'acc-bad' } }), makeRes(), next);
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
