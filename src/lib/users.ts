// Test account detection patterns — matches QA/test email conventions
export const TEST_ACCOUNT_PATTERNS = [
  /^qa_/i,           // qa_login_*, qa_state_*, qa_dbg_*
  /^qa-/i,           // qa-issue35-*
  /_test$/i,         // *_test
  /\+test/i,         // user+test@example.com
  /^testuser\+/i,    // testuser+*
  /^test[_-]/i,      // test_*, test-*
];

export const USERS_PAGE_SIZE = 20;

export function isTestAccount(email: string): boolean {
  return TEST_ACCOUNT_PATTERNS.some(pattern => pattern.test(email));
}
