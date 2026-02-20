/**
 * AccountService – Unit Tests
 *
 * Covers T049: listAccounts, getSelf, getByWorkgroup, getById methods.
 */

import { AccountService } from '../account.service';
import type { ShiftboardService, ShiftboardAccount } from '../shiftboard.service';

// ============================================================================
// Test Fixtures
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

function makeMockShiftboard(
  overrides: Partial<{
    listAccounts: jest.Mock;
    getSelf: jest.Mock;
    getAccountsByWorkgroup: jest.Mock;
    getAccountById: jest.Mock;
  }> = {}
): jest.Mocked<
  Pick<ShiftboardService, 'listAccounts' | 'getSelf' | 'getAccountsByWorkgroup' | 'getAccountById'>
> {
  return {
    listAccounts: jest.fn().mockResolvedValue([]),
    getSelf: jest.fn().mockResolvedValue(makeAccount()),
    getAccountsByWorkgroup: jest.fn().mockResolvedValue([]),
    getAccountById: jest.fn().mockResolvedValue(makeAccount()),
    ...overrides,
  } as any;
}

// ============================================================================
// Tests
// ============================================================================

describe('AccountService.listAccounts', () => {
  it('returns accounts sorted alphabetically by last_name', async () => {
    const shiftboard = makeMockShiftboard({
      listAccounts: jest
        .fn()
        .mockResolvedValue([
          makeAccount({ id: 'acc-2', last_name: 'Zebra', first_name: 'Alice' }),
          makeAccount({ id: 'acc-1', last_name: 'Apple', first_name: 'Bob' }),
          makeAccount({ id: 'acc-3', last_name: 'Mango', first_name: 'Carol' }),
        ]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.listAccounts();

    expect(result.accounts[0]!.last_name).toBe('Apple');
    expect(result.accounts[1]!.last_name).toBe('Mango');
    expect(result.accounts[2]!.last_name).toBe('Zebra');
  });

  it('sorts by first_name when last_names are equal', async () => {
    const shiftboard = makeMockShiftboard({
      listAccounts: jest
        .fn()
        .mockResolvedValue([
          makeAccount({ id: 'acc-2', last_name: 'Smith', first_name: 'Zara' }),
          makeAccount({ id: 'acc-1', last_name: 'Smith', first_name: 'Alice' }),
        ]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.listAccounts();

    expect(result.accounts[0]!.first_name).toBe('Alice');
    expect(result.accounts[1]!.first_name).toBe('Zara');
  });

  it('returns correct total count', async () => {
    const shiftboard = makeMockShiftboard({
      listAccounts: jest
        .fn()
        .mockResolvedValue([
          makeAccount({ id: 'acc-1' }),
          makeAccount({ id: 'acc-2' }),
          makeAccount({ id: 'acc-3' }),
        ]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.listAccounts();

    expect(result.total).toBe(3);
    expect(result.accounts).toHaveLength(3);
  });

  it('returns empty result when no accounts exist', async () => {
    const shiftboard = makeMockShiftboard({
      listAccounts: jest.fn().mockResolvedValue([]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.listAccounts();

    expect(result.accounts).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('passes workgroup filter param to shiftboard', async () => {
    const mockListAccounts = jest.fn().mockResolvedValue([]);
    const shiftboard = makeMockShiftboard({ listAccounts: mockListAccounts });

    const service = new AccountService(shiftboard as any);
    await service.listAccounts({ workgroup: 'wg-42' });

    expect(mockListAccounts).toHaveBeenCalledWith({ workgroup: 'wg-42' });
  });

  it('propagates errors from shiftboard API', async () => {
    const shiftboard = makeMockShiftboard({
      listAccounts: jest.fn().mockRejectedValue(new Error('API error')),
    });

    const service = new AccountService(shiftboard as any);
    await expect(service.listAccounts()).rejects.toThrow('API error');
  });

  it('does not mutate the original array', async () => {
    const original = [
      makeAccount({ id: 'acc-2', last_name: 'Zebra' }),
      makeAccount({ id: 'acc-1', last_name: 'Apple' }),
    ];
    const shiftboard = makeMockShiftboard({
      listAccounts: jest.fn().mockResolvedValue(original),
    });

    const service = new AccountService(shiftboard as any);
    await service.listAccounts();

    // Original order should be unchanged
    expect(original[0]!.last_name).toBe('Zebra');
    expect(original[1]!.last_name).toBe('Apple');
  });
});

describe('AccountService.getSelf', () => {
  it('returns the service account identity', async () => {
    const selfAccount = makeAccount({ id: 'self-1', screen_name: 'ServiceBot' });
    const shiftboard = makeMockShiftboard({
      getSelf: jest.fn().mockResolvedValue(selfAccount),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.getSelf();

    expect(result.account.id).toBe('self-1');
    expect(result.account.screen_name).toBe('ServiceBot');
  });

  it('calls shiftboard.getSelf exactly once', async () => {
    const mockGetSelf = jest.fn().mockResolvedValue(makeAccount());
    const shiftboard = makeMockShiftboard({ getSelf: mockGetSelf });

    const service = new AccountService(shiftboard as any);
    await service.getSelf();

    expect(mockGetSelf).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from shiftboard API', async () => {
    const shiftboard = makeMockShiftboard({
      getSelf: jest.fn().mockRejectedValue(new Error('Auth failed')),
    });

    const service = new AccountService(shiftboard as any);
    await expect(service.getSelf()).rejects.toThrow('Auth failed');
  });
});

describe('AccountService.getByWorkgroup', () => {
  it('returns accounts for the workgroup sorted alphabetically', async () => {
    const shiftboard = makeMockShiftboard({
      getAccountsByWorkgroup: jest
        .fn()
        .mockResolvedValue([
          makeAccount({ id: 'acc-2', last_name: 'Zebra' }),
          makeAccount({ id: 'acc-1', last_name: 'Apple' }),
        ]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.getByWorkgroup('wg-1');

    expect(result.accounts[0]!.last_name).toBe('Apple');
    expect(result.accounts[1]!.last_name).toBe('Zebra');
  });

  it('passes workgroupId to shiftboard.getAccountsByWorkgroup', async () => {
    const mockFn = jest.fn().mockResolvedValue([]);
    const shiftboard = makeMockShiftboard({ getAccountsByWorkgroup: mockFn });

    const service = new AccountService(shiftboard as any);
    await service.getByWorkgroup('wg-42');

    expect(mockFn).toHaveBeenCalledWith('wg-42');
  });

  it('throws when workgroupId is empty string', async () => {
    const service = new AccountService(makeMockShiftboard() as any);
    await expect(service.getByWorkgroup('')).rejects.toThrow('workgroupId is required');
  });

  it('throws when workgroupId is only whitespace', async () => {
    const service = new AccountService(makeMockShiftboard() as any);
    await expect(service.getByWorkgroup('   ')).rejects.toThrow('workgroupId is required');
  });

  it('returns empty list when workgroup has no accounts', async () => {
    const shiftboard = makeMockShiftboard({
      getAccountsByWorkgroup: jest.fn().mockResolvedValue([]),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.getByWorkgroup('wg-empty');

    expect(result.accounts).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('propagates errors from shiftboard API', async () => {
    const shiftboard = makeMockShiftboard({
      getAccountsByWorkgroup: jest.fn().mockRejectedValue(new Error('Not found')),
    });

    const service = new AccountService(shiftboard as any);
    await expect(service.getByWorkgroup('wg-1')).rejects.toThrow('Not found');
  });
});

describe('AccountService.getById', () => {
  it('returns the account for the given ID', async () => {
    const account = makeAccount({ id: 'acc-99', screen_name: 'FindMe' });
    const shiftboard = makeMockShiftboard({
      getAccountById: jest.fn().mockResolvedValue(account),
    });

    const service = new AccountService(shiftboard as any);
    const result = await service.getById('acc-99');

    expect(result.account.id).toBe('acc-99');
    expect(result.account.screen_name).toBe('FindMe');
  });

  it('passes accountId to shiftboard.getAccountById', async () => {
    const mockFn = jest.fn().mockResolvedValue(makeAccount());
    const shiftboard = makeMockShiftboard({ getAccountById: mockFn });

    const service = new AccountService(shiftboard as any);
    await service.getById('acc-42');

    expect(mockFn).toHaveBeenCalledWith('acc-42');
  });

  it('throws when accountId is empty string', async () => {
    const service = new AccountService(makeMockShiftboard() as any);
    await expect(service.getById('')).rejects.toThrow('accountId is required');
  });

  it('throws when accountId is only whitespace', async () => {
    const service = new AccountService(makeMockShiftboard() as any);
    await expect(service.getById('   ')).rejects.toThrow('accountId is required');
  });

  it('propagates errors from shiftboard API', async () => {
    const shiftboard = makeMockShiftboard({
      getAccountById: jest.fn().mockRejectedValue(new Error('Account not found')),
    });

    const service = new AccountService(shiftboard as any);
    await expect(service.getById('acc-1')).rejects.toThrow('Account not found');
  });
});
