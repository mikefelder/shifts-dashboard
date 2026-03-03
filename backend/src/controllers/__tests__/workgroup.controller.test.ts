/**
 * Workgroup Controller Tests
 *
 * Unit tests for workgroup controller handler functions.
 * Uses mock request/response objects to test handlers in isolation.
 */

import { createWorkgroupController } from '../workgroup.controller';
import type { WorkgroupResult, RoleResult } from '../../services/workgroup.service';

// ============================================================================
// Helpers: Mock req/res
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

// ============================================================================
// Fixtures
// ============================================================================

const mockWorkgroupResult: WorkgroupResult = {
  workgroups: [
    { id: 'wg-1', name: 'Alpha Squad' },
    { id: 'wg-2', name: 'Bravo Crew' },
  ],
  total: 2,
};

const mockRoleResult: RoleResult = {
  roles: [
    { id: 'role-1', name: 'Associate' },
    { id: 'role-2', name: 'Supervisor' },
  ],
  total: 2,
  workgroupId: 'wg-1',
};

// ============================================================================
// Mock Service Factory
// ============================================================================

function makeMockWorkgroupService(
  overrides: {
    listWorkgroups?: () => Promise<WorkgroupResult>;
    getRoles?: (id: string) => Promise<RoleResult>;
  } = {}
) {
  return {
    listWorkgroups: jest.fn().mockResolvedValue(mockWorkgroupResult),
    getRoles: jest.fn().mockResolvedValue(mockRoleResult),
    listAllRoles: jest.fn().mockResolvedValue({ roles: [], total: 0 }),
    ...overrides,
  } as unknown as import('../../services/workgroup.service').WorkgroupService;
}

// ============================================================================
// Utility: Run the last handler in a middleware array
// ============================================================================

async function runLastHandler(
  handlers: Array<any>,
  req: import('express').Request,
  res: import('express').Response
): Promise<void> {
  const handler = handlers[handlers.length - 1];
  // asyncHandler wraps a function — call the inner fn directly
  await handler(req, res, jest.fn());
}

// ============================================================================
// Tests: listWorkgroups
// ============================================================================

describe('WorkgroupController.listWorkgroups', () => {
  it('responds with 200 and workgroup result shape', async () => {
    const controller = createWorkgroupController(makeMockWorkgroupService());
    const req = makeReq();
    const res = makeRes();

    await runLastHandler(controller.listWorkgroups, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          workgroups: mockWorkgroupResult.workgroups,
          total: 2,
        }),
        timing: expect.objectContaining({ duration_ms: expect.any(Number) }),
      })
    );
  });

  it('calls workgroupService.listWorkgroups once', async () => {
    const mockService = makeMockWorkgroupService();
    const controller = createWorkgroupController(mockService);

    await runLastHandler(controller.listWorkgroups, makeReq(), makeRes());

    expect(mockService.listWorkgroups).toHaveBeenCalledTimes(1);
  });

  it('propagates service errors (asyncHandler surfaces them)', async () => {
    const controller = createWorkgroupController(
      makeMockWorkgroupService({
        listWorkgroups: jest.fn().mockRejectedValue(new Error('API down')),
      })
    );
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    // asyncHandler wraps the fn in Promise.resolve().catch(next)
    // so we need to flush the microtask queue for next to be called
    const handler = controller.listWorkgroups.at(-1)!;
    handler(req, res, next);
    await Promise.resolve();
    await Promise.resolve(); // double-flush ensures catch runs

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('timing.duration_ms is a non-negative number', async () => {
    const controller = createWorkgroupController(makeMockWorkgroupService());
    const res = makeRes();

    await runLastHandler(controller.listWorkgroups, makeReq(), res);

    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.timing.duration_ms).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Tests: getRoles
// ============================================================================

describe('WorkgroupController.getRoles', () => {
  it('responds with 200 and role result shape', async () => {
    const controller = createWorkgroupController(makeMockWorkgroupService());
    const req = makeReq({ params: { workgroupId: 'wg-1' } });
    const res = makeRes();

    await runLastHandler(controller.getRoles, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          workgroupId: 'wg-1',
          roles: mockRoleResult.roles,
          total: 2,
        }),
      })
    );
  });

  it('calls workgroupService.getRoles with the correct workgroupId', async () => {
    const mockService = makeMockWorkgroupService();
    const controller = createWorkgroupController(mockService);
    const req = makeReq({ params: { workgroupId: 'wg-abc' } });

    await runLastHandler(controller.getRoles, req, makeRes());

    expect(mockService.getRoles).toHaveBeenCalledWith('wg-abc');
  });

  it('propagates service errors', async () => {
    const controller = createWorkgroupController(
      makeMockWorkgroupService({
        getRoles: jest.fn().mockRejectedValue(new Error('Not found')),
      })
    );
    const req = makeReq({ params: { workgroupId: 'wg-bad' } });
    const next = jest.fn();

    const handler = controller.getRoles.at(-1)!;
    handler(req, makeRes(), next);
    await Promise.resolve();
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('includes timing metadata with non-negative duration', async () => {
    const controller = createWorkgroupController(makeMockWorkgroupService());
    const res = makeRes();

    await runLastHandler(controller.getRoles, makeReq({ params: { workgroupId: 'wg-1' } }), res);

    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.timing.duration_ms).toBeGreaterThanOrEqual(0);
    expect(response.timing.start).toBeDefined();
    expect(response.timing.end).toBeDefined();
  });
});
