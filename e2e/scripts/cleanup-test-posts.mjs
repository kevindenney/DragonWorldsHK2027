#!/usr/bin/env node
/**
 * Cleanup Maestro Test Posts
 *
 * Deletes all posts from venue_discussions that have titles starting with:
 * - [MAESTRO-TEST]
 * - [MAESTRO-OUTCOMES]
 *
 * Run with: node e2e/scripts/cleanup-test-posts.mjs
 */

import { createClient } from '@supabase/supabase-js';

// RegattaFlow Supabase credentials (same as used in communityService)
const SUPABASE_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

// Service role key for admin operations (needs to be set in environment)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanupTestPosts() {
  console.log('🧹 Cleaning up Maestro test posts...\n');

  // Find all test posts
  const { data: testPosts, error: findError } = await supabase
    .from('venue_discussions')
    .select('id, title, created_at')
    .or('title.ilike.[MAESTRO-TEST]%,title.ilike.[MAESTRO-OUTCOMES]%')
    .order('created_at', { ascending: false });

  if (findError) {
    console.error('Error finding test posts:', findError.message);
    process.exit(1);
  }

  if (!testPosts || testPosts.length === 0) {
    console.log('✅ No test posts found. Database is clean!\n');
    return;
  }

  console.log(`Found ${testPosts.length} test post(s) to delete:\n`);
  testPosts.forEach((post, index) => {
    const date = new Date(post.created_at).toLocaleString();
    console.log(`  ${index + 1}. "${post.title}" (${date})`);
  });
  console.log('');

  // Delete all test posts
  const postIds = testPosts.map(p => p.id);

  const { error: deleteError } = await supabase
    .from('venue_discussions')
    .delete()
    .in('id', postIds);

  if (deleteError) {
    console.error('Error deleting test posts:', deleteError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${testPosts.length} test post(s)!\n`);

  // Also clean up test users (optional - they won't hurt anything)
  const { data: testUsers, error: userFindError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .or('email.ilike.%@maestro.test,full_name.ilike.%Test%')
    .limit(50);

  if (userFindError) {
    console.log('Note: Could not check for test users:', userFindError.message);
  } else if (testUsers && testUsers.length > 0) {
    console.log(`Found ${testUsers.length} test user(s) (not deleting - for reference only):`);
    testUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.full_name || 'Unknown'} <${user.email}>`);
    });
    console.log('');
  }

  console.log('🎉 Cleanup complete!\n');
}

// Run cleanup
cleanupTestPosts().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
