/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests complete
 */

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up E2E test environment...');

  // Add any cleanup logic here if needed
  // For example, clearing test databases, temp files, etc.

  console.log('✅ Cleanup complete');
}
