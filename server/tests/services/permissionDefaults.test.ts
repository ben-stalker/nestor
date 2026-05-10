import { ALL_PERMISSIONS } from '../../src/middleware/permissions';
import defaultsFor from '../../src/services/permissionDefaults';
import type { ProfileType } from '../../src/types/profile';

const PROFILE_TYPES: ProfileType[] = [
  'admin',
  'grandparent',
  'teen',
  'child',
  'toddler',
  'baby',
  'guest',
];

describe('defaultsFor', () => {
  it.each(PROFILE_TYPES)('matches snapshot for %s', (type) => {
    expect(defaultsFor(type)).toMatchSnapshot();
  });

  it.each(PROFILE_TYPES)('every ALL_PERMISSIONS key is present for %s', (type) => {
    const defaults = defaultsFor(type);
    ALL_PERMISSIONS.forEach((key) => {
      expect(defaults).toHaveProperty(key);
      expect(typeof defaults[key]).toBe('boolean');
    });
  });

  it('admin has all permissions set to true', () => {
    const defaults = defaultsFor('admin');
    ALL_PERMISSIONS.forEach((key) => {
      expect(defaults[key]).toBe(true);
    });
  });

  it('baby has no permissions (all false)', () => {
    const defaults = defaultsFor('baby');
    ALL_PERMISSIONS.forEach((key) => {
      expect(defaults[key]).toBe(false);
    });
  });

  it('child does not have admin-only permissions', () => {
    const defaults = defaultsFor('child');
    expect(defaults.manage_settings).toBe(false);
    expect(defaults.manage_plugins).toBe(false);
    expect(defaults.view_finance).toBe(false);
    expect(defaults.manage_finance).toBe(false);
    expect(defaults.manage_vehicles).toBe(false);
  });

  it('returns a copy — mutations do not affect subsequent calls', () => {
    const a = defaultsFor('child');
    a.view_calendar = false;
    const b = defaultsFor('child');
    expect(b.view_calendar).toBe(true);
  });

  it('is pure — repeated calls return equal values', () => {
    expect(defaultsFor('teen')).toEqual(defaultsFor('teen'));
  });
});
