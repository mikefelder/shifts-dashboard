/**
 * Workgroup Service Tests
 *
 * Unit tests for WorkgroupService business logic.
 * Mocks ShiftboardService to test in isolation.
 */

import { WorkgroupService } from '../workgroup.service';
import type { ShiftboardWorkgroup, ShiftboardRole } from '../shiftboard.service';

// ============================================================================
// Fixtures
// ============================================================================

const mockWorkgroups: ShiftboardWorkgroup[] = [
  { id: 'wg-3', name: 'Zeta Team' },
  { id: 'wg-1', name: 'Alpha Squad', description: 'First responders' },
  { id: 'wg-2', name: 'Bravo Crew' },
];

const mockRoles: ShiftboardRole[] = [
  { id: 'role-2', name: 'Supervisor', color: '#ff0000' },
  { id: 'role-1', name: 'Associate', description: 'Entry level' },
  { id: 'role-3', name: 'Team Lead' },
];

// ============================================================================
// Mock Factory
// ============================================================================

function makeMockShiftboard(
  overrides: {
    listWorkgroups?: () => Promise<ShiftboardWorkgroup[]>;
    getWorkgroupRoles?: (id: string) => Promise<ShiftboardRole[]>;
    listRoles?: () => Promise<ShiftboardRole[]>;
  } = {}
) {
  return {
    listWorkgroups: jest.fn().mockResolvedValue(mockWorkgroups),
    getWorkgroupRoles: jest.fn().mockResolvedValue(mockRoles),
    listRoles: jest.fn().mockResolvedValue(mockRoles),
    ...overrides,
  } as unknown as import('../shiftboard.service').ShiftboardService;
}

// ============================================================================
// Tests: listWorkgroups
// ============================================================================

describe('WorkgroupService.listWorkgroups', () => {
  it('returns workgroups sorted alphabetically by name', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.listWorkgroups();

    expect(result.workgroups.map((w) => w.name)).toEqual([
      'Alpha Squad',
      'Bravo Crew',
      'Zeta Team',
    ]);
  });

  it('returns correct total count', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.listWorkgroups();

    expect(result.total).toBe(3);
    expect(result.workgroups).toHaveLength(3);
  });

  it('returns empty result when no workgroups exist', async () => {
    const service = new WorkgroupService(
      makeMockShiftboard({ listWorkgroups: jest.fn().mockResolvedValue([]) })
    );
    const result = await service.listWorkgroups();

    expect(result.workgroups).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('calls shiftboard.listWorkgroups exactly once', async () => {
    const mock = makeMockShiftboard();
    const service = new WorkgroupService(mock);
    await service.listWorkgroups();

    expect(mock.listWorkgroups).toHaveBeenCalledTimes(1);
  });

  it('preserves all workgroup fields', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.listWorkgroups();

    const alpha = result.workgroups.find((w) => w.id === 'wg-1');
    expect(alpha?.description).toBe('First responders');
  });

  it('handles workgroups with missing names gracefully', async () => {
    const namelesWorkgroups = [
      { id: 'wg-a', name: '' } as ShiftboardWorkgroup,
      { id: 'wg-b', name: 'Named' } as ShiftboardWorkgroup,
    ];
    const service = new WorkgroupService(
      makeMockShiftboard({
        listWorkgroups: jest.fn().mockResolvedValue(namelesWorkgroups),
      })
    );
    const result = await service.listWorkgroups();

    // Empty string sorts before 'Named'
    expect(result.workgroups[0]!.name).toBe('');
    expect(result.workgroups[1]!.name).toBe('Named');
  });

  it('propagates errors from shiftboard API', async () => {
    const service = new WorkgroupService(
      makeMockShiftboard({
        listWorkgroups: jest.fn().mockRejectedValue(new Error('API error')),
      })
    );

    await expect(service.listWorkgroups()).rejects.toThrow('API error');
  });
});

// ============================================================================
// Tests: getRoles
// ============================================================================

describe('WorkgroupService.getRoles', () => {
  it('returns roles sorted alphabetically by name', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.getRoles('wg-1');

    expect(result.roles.map((r) => r.name)).toEqual(['Associate', 'Supervisor', 'Team Lead']);
  });

  it('includes the workgroupId in the result', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.getRoles('wg-123');

    expect(result.workgroupId).toBe('wg-123');
  });

  it('returns correct total count', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.getRoles('wg-1');

    expect(result.total).toBe(3);
  });

  it('calls shiftboard.getWorkgroupRoles with the correct workgroupId', async () => {
    const mock = makeMockShiftboard();
    const service = new WorkgroupService(mock);
    await service.getRoles('wg-abc');

    expect(mock.getWorkgroupRoles).toHaveBeenCalledWith('wg-abc');
  });

  it('throws when workgroupId is empty string', async () => {
    const service = new WorkgroupService(makeMockShiftboard());

    await expect(service.getRoles('')).rejects.toThrow('workgroupId is required');
  });

  it('throws when workgroupId is only whitespace', async () => {
    const service = new WorkgroupService(makeMockShiftboard());

    await expect(service.getRoles('   ')).rejects.toThrow('workgroupId is required');
  });

  it('propagates errors from shiftboard API', async () => {
    const service = new WorkgroupService(
      makeMockShiftboard({
        getWorkgroupRoles: jest.fn().mockRejectedValue(new Error('Not found')),
      })
    );

    await expect(service.getRoles('wg-1')).rejects.toThrow('Not found');
  });

  it('returns empty roles when workgroup has none', async () => {
    const service = new WorkgroupService(
      makeMockShiftboard({
        getWorkgroupRoles: jest.fn().mockResolvedValue([]),
      })
    );
    const result = await service.getRoles('wg-empty');

    expect(result.roles).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ============================================================================
// Tests: listAllRoles
// ============================================================================

describe('WorkgroupService.listAllRoles', () => {
  it('returns all roles sorted alphabetically', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.listAllRoles();

    expect(result.roles.map((r) => r.name)).toEqual(['Associate', 'Supervisor', 'Team Lead']);
  });

  it('returns correct total', async () => {
    const service = new WorkgroupService(makeMockShiftboard());
    const result = await service.listAllRoles();

    expect(result.total).toBe(3);
  });

  it('calls shiftboard.listRoles once', async () => {
    const mock = makeMockShiftboard();
    const service = new WorkgroupService(mock);
    await service.listAllRoles();

    expect(mock.listRoles).toHaveBeenCalledTimes(1);
  });
});
