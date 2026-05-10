import type { Profile } from './profile';

declare global {
  namespace Express {
    interface Request {
      profile?: Profile;
    }
  }
}

export {};
