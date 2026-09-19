import {
  assertAssistantDataAccess,
  ASSISTANT_BLOCKED_TABLES,
} from './assistant-data.registry';

describe('assistant data registry', () => {
  it('blocks protected system tables', () => {
    expect(() => assertAssistantDataAccess('inventory', ['users'])).toThrow(
      'Blocked table',
    );
    expect(ASSISTANT_BLOCKED_TABLES.has('users')).toBe(true);
  });

  it('allows intended business tables', () => {
    expect(() =>
      assertAssistantDataAccess('inventory', ['ingredients', 'warehouses']),
    ).not.toThrow();
  });

  it('rejects tables outside the allowed set for an intent', () => {
    expect(() => assertAssistantDataAccess('menu', ['users'])).toThrow(
      'not allowed',
    );
  });
});
