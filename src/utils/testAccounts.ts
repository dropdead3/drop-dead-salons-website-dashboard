/**
 * Utility function to identify test accounts.
 * Test accounts are identified by having 'test' in their name or email.
 */
export function isTestAccount(profile: { 
  email?: string | null; 
  full_name?: string | null;
}): boolean {
  const email = profile.email?.toLowerCase() || '';
  const name = profile.full_name?.toLowerCase() || '';
  return email.includes('test') || name.includes('test');
}
