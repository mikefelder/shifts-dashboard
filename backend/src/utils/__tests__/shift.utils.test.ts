/**
 * Shift Utilities Tests
 *
 * Unit tests for shift grouping, filtering, counting, and validation utilities.
 * Performance: grouping 1000 shifts must complete in <50ms.
 */

import {
  groupShiftsByAttributes,
  countClockedIn,
  countTotalAssigned,
  filterByWorkgroup,
  isValidShift,
  type RawShift,
  type Account,
  type GroupedShift,
} from '../shift.utils';

// ============================================================================
// Fixtures
// ============================================================================

function makeShift(overrides: Partial<RawShift> = {}): RawShift {
  return {
    id: 'shift-1',
    name: 'Morning Security',
    local_start_date: '2026-02-20T08:00:00',
    local_end_date: '2026-02-20T16:00:00',
    covering_member: 'account-1',
    clocked_in: false,
    workgroup: 'wg-1',
    subject: 'Gate A',
    location: 'Main Campus',
    ...overrides,
  };
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'account-1',
    first_name: 'Alice',
    last_name: 'Smith',
    screen_name: 'alice.smith',
    ...overrides,
  };
}

// ============================================================================
// Tests: groupShiftsByAttributes
// ============================================================================

describe('groupShiftsByAttributes', () => {
  it('returns empty array for empty input', () => {
    expect(groupShiftsByAttributes([], [])).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(groupShiftsByAttributes(null as any, [])).toEqual([]);
  });

  it('returns one group for a single shift', () => {
    const result = groupShiftsByAttributes([makeShift()], []);
    expect(result).toHaveLength(1);
  });

  it('groups two shifts with identical attributes into one group', () => {
    const shifts = [
      makeShift({ id: 's1', covering_member: 'acct-1' }),
      makeShift({ id: 's2', covering_member: 'acct-2' }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result).toHaveLength(1);
    expect(result[0]!.assignedPeople).toEqual(['acct-1', 'acct-2']);
  });

  it('does NOT group shifts with different names', () => {
    const shifts = [
      makeShift({ id: 's1', name: 'Shift A' }),
      makeShift({ id: 's2', name: 'Shift B' }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result).toHaveLength(2);
  });

  it('does NOT group shifts with different start times', () => {
    const shifts = [
      makeShift({ id: 's1', local_start_date: '2026-02-20T08:00:00' }),
      makeShift({ id: 's2', local_start_date: '2026-02-20T09:00:00' }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result).toHaveLength(2);
  });

  it('does NOT group shifts with different workgroups', () => {
    const shifts = [
      makeShift({ id: 's1', workgroup: 'wg-1' }),
      makeShift({ id: 's2', workgroup: 'wg-2' }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result).toHaveLength(2);
  });

  it('deduplicates the same covering_member within a group', () => {
    const shifts = [
      makeShift({ id: 's1', covering_member: 'acct-1' }),
      makeShift({ id: 's2', covering_member: 'acct-1' }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result[0]!.assignedPeople).toHaveLength(1);
  });

  it('preserves clock-in status per person', () => {
    const shifts = [
      makeShift({ id: 's1', covering_member: 'acct-1', clocked_in: true }),
      makeShift({ id: 's2', covering_member: 'acct-2', clocked_in: false }),
    ];
    const result = groupShiftsByAttributes(shifts, []);

    expect(result[0]!.clockStatuses).toEqual([true, false]);
  });

  it('coerces null clocked_in to false', () => {
    const shift = makeShift({ clocked_in: null });
    const result = groupShiftsByAttributes([shift], []);

    expect(result[0]!.clockStatuses[0]).toBe(false);
  });

  it('resolves name from screen_name when present', () => {
    const accounts = [makeAccount({ id: 'acct-1', screen_name: 'a.smith' })];
    const result = groupShiftsByAttributes([makeShift({ covering_member: 'acct-1' })], accounts);

    expect(result[0]!.assignedPersonNames[0]).toBe('a.smith');
  });

  it('resolves name from first+last when screen_name is absent', () => {
    const accounts = [
      makeAccount({
        id: 'acct-1',
        screen_name: undefined,
        first_name: 'Alice',
        last_name: 'Smith',
      }),
    ];
    const result = groupShiftsByAttributes([makeShift({ covering_member: 'acct-1' })], accounts);

    expect(result[0]!.assignedPersonNames[0]).toBe('Alice Smith');
  });

  it('resolves to "Unassigned" when account not found', () => {
    const result = groupShiftsByAttributes([makeShift({ covering_member: 'unknown-id' })], []);

    expect(result[0]!.assignedPersonNames[0]).toBe('Unassigned');
  });

  it('handles shift with no covering_member (empty slot)', () => {
    const shift = makeShift({ covering_member: undefined });
    const result = groupShiftsByAttributes([shift], []);

    expect(result[0]!.assignedPeople).toEqual([]);
    expect(result[0]!.assignedPersonNames).toEqual([]);
    expect(result[0]!.clockStatuses).toEqual([]);
  });

  it('skips shifts missing required id field', () => {
    const invalid = makeShift({ id: '' });
    const valid = makeShift({ id: 'valid' });
    const result = groupShiftsByAttributes([invalid, valid], []);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('valid');
  });

  it('skips shifts missing required name field', () => {
    const invalid = makeShift({ name: '' });
    const valid = makeShift({ id: 'valid-2', name: 'Good Shift' });
    const result = groupShiftsByAttributes([invalid, valid], []);

    expect(result).toHaveLength(1);
  });

  it('does not mutate the original shift array', () => {
    const shifts = [makeShift()];
    const original = [...shifts];
    groupShiftsByAttributes(shifts, []);
    expect(shifts).toEqual(original);
  });

  describe('performance', () => {
    it('groups 1000 shifts in under 50ms', () => {
      const shifts: RawShift[] = Array.from({ length: 1000 }, (_, i) =>
        makeShift({
          id: `shift-${i}`,
          name: `Shift ${i % 20}`, // 20 unique groups
          covering_member: `acct-${i % 50}`,
        })
      );

      const start = performance.now();
      groupShiftsByAttributes(shifts, []);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});

// ============================================================================
// Tests: countClockedIn
// ============================================================================

describe('countClockedIn', () => {
  it('returns 0 for empty array', () => {
    expect(countClockedIn([])).toBe(0);
  });

  it('counts clocked-in people across multiple shifts', () => {
    const shifts: GroupedShift[] = [
      {
        ...makeShift(),
        assignedPeople: ['a', 'b'],
        assignedPersonNames: [],
        clockStatuses: [true, false],
      },
      {
        ...makeShift({ id: 's2' }),
        assignedPeople: ['c'],
        assignedPersonNames: [],
        clockStatuses: [true],
      },
    ];
    expect(countClockedIn(shifts)).toBe(2);
  });

  it('returns 0 when nobody is clocked in', () => {
    const shifts: GroupedShift[] = [
      {
        ...makeShift(),
        assignedPeople: ['a', 'b'],
        assignedPersonNames: [],
        clockStatuses: [false, false],
      },
    ];
    expect(countClockedIn(shifts)).toBe(0);
  });

  it('handles shifts with no assigned people', () => {
    const shifts: GroupedShift[] = [
      { ...makeShift(), assignedPeople: [], assignedPersonNames: [], clockStatuses: [] },
    ];
    expect(countClockedIn(shifts)).toBe(0);
  });
});

// ============================================================================
// Tests: countTotalAssigned
// ============================================================================

describe('countTotalAssigned', () => {
  it('returns 0 for empty array', () => {
    expect(countTotalAssigned([])).toBe(0);
  });

  it('sums assigned people across all shifts', () => {
    const shifts: GroupedShift[] = [
      { ...makeShift(), assignedPeople: ['a', 'b'], assignedPersonNames: [], clockStatuses: [] },
      {
        ...makeShift({ id: 's2' }),
        assignedPeople: ['c', 'd', 'e'],
        assignedPersonNames: [],
        clockStatuses: [],
      },
    ];
    expect(countTotalAssigned(shifts)).toBe(5);
  });

  it('handles shifts with no assigned people', () => {
    const shifts: GroupedShift[] = [
      { ...makeShift(), assignedPeople: [], assignedPersonNames: [], clockStatuses: [] },
    ];
    expect(countTotalAssigned(shifts)).toBe(0);
  });
});

// ============================================================================
// Tests: filterByWorkgroup
// ============================================================================

describe('filterByWorkgroup', () => {
  const shifts = [
    makeShift({ id: 's1', workgroup: 'wg-1' }),
    makeShift({ id: 's2', workgroup: 'wg-2' }),
    makeShift({ id: 's3', workgroup: 'wg-1' }),
  ];

  it('returns all shifts when workgroupId is null', () => {
    expect(filterByWorkgroup(shifts, null)).toHaveLength(3);
  });

  it('returns empty string workgroupId passes through as null (no filter)', () => {
    // Empty string is falsy — treated as no filter
    expect(filterByWorkgroup(shifts, '')).toHaveLength(3);
  });

  it('filters shifts to only the specified workgroup', () => {
    const result = filterByWorkgroup(shifts, 'wg-1');
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.workgroup === 'wg-1')).toBe(true);
  });

  it('returns empty array when no shifts match workgroup', () => {
    expect(filterByWorkgroup(shifts, 'wg-999')).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const original = [...shifts];
    filterByWorkgroup(shifts, 'wg-1');
    expect(shifts).toEqual(original);
  });

  it('works with empty input array', () => {
    expect(filterByWorkgroup([], 'wg-1')).toEqual([]);
  });
});

// ============================================================================
// Tests: isValidShift
// ============================================================================

describe('isValidShift', () => {
  it('returns true for a valid shift', () => {
    expect(isValidShift(makeShift())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidShift(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidShift('string')).toBe(false);
    expect(isValidShift(42)).toBe(false);
  });

  it('returns false when id is missing', () => {
    expect(isValidShift({ ...makeShift(), id: '' })).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(isValidShift({ ...makeShift(), name: '' })).toBe(false);
  });

  it('returns false when local_start_date is missing', () => {
    expect(isValidShift({ ...makeShift(), local_start_date: '' })).toBe(false);
  });

  it('returns false when local_end_date is missing', () => {
    expect(isValidShift({ ...makeShift(), local_end_date: '' })).toBe(false);
  });
});
