import bcrypt from 'bcrypt';
import type Database from 'better-sqlite3';
import ProfileRepository from '../../src/repositories/ProfileRepository';
import type { Profile } from '../../src/types/profile';

export interface BasicFixtures {
  admin: Profile;
  child: Profile;
  adminPin: string;
}

/**
 * Seed one admin + one child profile. Returns the seeded profiles and the plain-text admin PIN.
 */
export function seedBasic(db: Database.Database): BasicFixtures {
  const profileRepo = new ProfileRepository(db);
  const adminPin = '0000';

  const admin = profileRepo.create({
    name: 'Admin',
    type: 'admin',
    colour: '#3B82F6',
    pin: adminPin,
  });

  const child = profileRepo.create({
    name: 'Alex',
    type: 'child',
    colour: '#10B981',
  });

  return { admin, child, adminPin };
}

/** Hash a plain-text PIN at bcrypt cost 10 (matches app default) */
export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
