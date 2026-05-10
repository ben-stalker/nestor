class LastAdminError extends Error {
  readonly code = 'LAST_ADMIN' as const;

  constructor() {
    super('Cannot delete the last admin profile');
    this.name = 'LastAdminError';
  }
}

export default LastAdminError;
