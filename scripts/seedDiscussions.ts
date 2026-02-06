/**
 * Seed Script for Community Discussions
 *
 * Removes existing discussions and replaces them with sample discussions
 * relevant to APAC racing and Dragon Worlds Hong Kong 2027.
 *
 * Run with: SUPABASE_SERVICE_KEY=<key> npx tsx scripts/seedDiscussions.ts
 *
 * Get your service role key from: Supabase Dashboard > Settings > API > service_role key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// RegattaFlow Supabase configuration
const SUPABASE_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

// Service role key is required to bypass RLS
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const DRAGON_WORLDS_COMMUNITY_SLUG = '2027-hk-dragon-worlds';

// Sample discussions for Dragon Worlds HK 2027
const SAMPLE_DISCUSSIONS = [
  {
    title: '[SAMPLE] Best time to arrive in Hong Kong before the event?',
    body: 'Planning my trip for Dragon Worlds 2027. Should I arrive a few days early to adjust to the time zone and check out the venue at Clearwater Bay? What do experienced APAC racers recommend?',
    post_type: 'question',
    pinned: false,
  },
  {
    title: '[SAMPLE] Nine Pins / Clearwater Bay wind patterns - local knowledge',
    body: 'For those who have raced in the Nine Pins area near Clearwater Bay before, what are the typical wind patterns to expect? I hear the easterly trades can be quite consistent but the islands create some interesting shifts. Any tips for racing around the Ninepin Group?',
    post_type: 'tip',
    pinned: true,
  },
  {
    title: '[SAMPLE] Recommended hotels near Clearwater Bay?',
    body: 'Looking for accommodation recommendations near Clearwater Bay or Sai Kung area. Budget-friendly options preferred but open to suggestions. Is it better to stay closer to the venue or in Kowloon/HK Island and commute?',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Charter boat availability for Dragon Worlds',
    body: 'Has anyone looked into chartering a Dragon for the event? I am traveling from Australia and shipping my own boat is quite expensive. Any leads on available charters in Hong Kong?',
    post_type: 'question',
    pinned: false,
  },
  {
    title: '[SAMPLE] Tidal currents around the Nine Pins',
    body: 'The tidal currents around the Ninepin Group can be significant. I have found some general resources but wondering if anyone has specific current charts or local knowledge about how the tides affect racing in the Clearwater Bay area? Which way does the flood run?',
    post_type: 'tip',
    pinned: false,
  },
  {
    title: '[SAMPLE] Practice session partners wanted - Clearwater Bay',
    body: 'Looking for other teams interested in practice sessions before the official racing begins. We are arriving 5 days early and would love to get some training time on the water around the Nine Pins with other competitors.',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Weather forecast sources for Clearwater Bay racing',
    body: 'What weather apps or websites do locals use for accurate marine forecasts in Hong Kong? I usually rely on Windy and PredictWind but wondering if there are better local sources for the Clearwater Bay and Nine Pins area.',
    post_type: 'question',
    pinned: false,
  },
  {
    title: '[SAMPLE] Equipment inspection and measurement requirements',
    body: 'Can anyone share details about the equipment inspection process? Will there be pre-event measurement days? What documentation should we bring for our sails and equipment?',
    post_type: 'question',
    pinned: false,
  },
  {
    title: '[SAMPLE] Transportation from HKG airport to Clearwater Bay',
    body: 'Just confirmed my flights! What is the best way to get from Hong Kong International Airport to Clearwater Bay? I will have sailing gear with me. Taxi, MTR to Hang Hau then taxi, or should I arrange private transfer?',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Social events and competitor dinners',
    body: 'Beyond the racing, I am looking forward to connecting with fellow Dragon sailors from around the world. Has anyone heard about the social programme for Dragon Worlds 2027? Competitor dinners, prize giving location? Is Sai Kung town good for evening activities?',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Typhoon season considerations',
    body: 'The event falls during typhoon season in Hong Kong. Has anyone experienced a typhoon delay at Clearwater Bay events before? How does the club handle weather postponements? Just want to be prepared.',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Local sailmakers and emergency repairs',
    body: 'Does anyone know of good sailmakers or riggers in Hong Kong for emergency repairs during the event? Always good to have contacts ready just in case. Anyone near the Sai Kung / Clearwater Bay area?',
    post_type: 'tip',
    pinned: false,
  },
  {
    title: '[SAMPLE] Crew looking for boat - Dragon Worlds 2027',
    body: 'Experienced Dragon crew available for Dragon Worlds HK 2027. 15 years racing experience in Europe and 3 World Championships. Looking for a competitive team. Can help with boat preparation if arriving early.',
    post_type: 'discussion',
    pinned: false,
  },
  {
    title: '[SAMPLE] Food and dining near Clearwater Bay / Sai Kung',
    body: 'First time visiting Hong Kong! What are the must-try restaurants near Clearwater Bay or in Sai Kung town? Looking for recommendations for team dinners and casual seafood. Any good spots for breakfast before racing?',
    post_type: 'question',
    pinned: false,
  },
  {
    title: '[SAMPLE] Registration and entry deadline reminder',
    body: 'Friendly reminder that early bird registration closes soon. Make sure to get your entries in! The Notice of Race is available on the official website. See you all on the water at the Nine Pins!',
    post_type: 'tip',
    pinned: true,
  },
];

async function seedDiscussions() {
  console.log('Starting discussion seeding process...\n');

  // Check for service key
  if (!SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is required.\n');
    console.log('The RegattaFlow Supabase database has Row Level Security (RLS) enabled.');
    console.log('You need the service_role key to bypass RLS for seeding.\n');
    console.log('Get it from: Supabase Dashboard > Settings > API > service_role key\n');
    console.log('Then run: SUPABASE_SERVICE_KEY=<your-key> npx tsx scripts/seedDiscussions.ts');
    process.exit(1);
  }

  console.log('Using service role key to bypass RLS...\n');

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Step 1: Get the Dragon Worlds community
  console.log(`Fetching community: ${DRAGON_WORLDS_COMMUNITY_SLUG}`);
  const { data: community, error: communityError } = await client
    .from('communities_with_stats')
    .select('id, name')
    .eq('slug', DRAGON_WORLDS_COMMUNITY_SLUG)
    .single();

  if (communityError || !community) {
    console.error('Failed to fetch community:', communityError?.message);
    console.error('\nMake sure the community exists in the database.');
    process.exit(1);
  }

  console.log(`Found community: ${community.name} (${community.id})\n`);

  // Step 2: Delete existing discussions for this community
  console.log('Deleting existing discussions...');
  const { error: deleteError, count: deleteCount } = await client
    .from('venue_discussions')
    .delete({ count: 'exact' })
    .eq('community_id', community.id);

  if (deleteError) {
    console.error('Failed to delete discussions:', deleteError.message);
    console.log('\nNote: This may require elevated permissions. Try using a service role key.');
    process.exit(1);
  }

  console.log(`Deleted ${deleteCount ?? 0} existing discussions.\n`);

  // Step 3: Insert new sample discussions
  console.log('Inserting sample discussions...');

  const now = new Date();
  const discussionsToInsert = SAMPLE_DISCUSSIONS.map((discussion, index) => ({
    community_id: community.id,
    author_id: null, // Anonymous sample posts
    title: discussion.title,
    body: discussion.body,
    post_type: discussion.post_type,
    pinned: discussion.pinned,
    is_public: true,
    upvotes: Math.floor(Math.random() * 15) + 1, // Random upvotes 1-15
    downvotes: 0,
    comment_count: Math.floor(Math.random() * 5), // Random comments 0-4
    view_count: Math.floor(Math.random() * 50) + 10, // Random views 10-59
    is_resolved: false,
    created_at: new Date(now.getTime() - index * 3600000 * 4).toISOString(), // Stagger creation times
  }));

  const { data: insertedData, error: insertError } = await client
    .from('venue_discussions')
    .insert(discussionsToInsert)
    .select('id, title');

  if (insertError) {
    console.error('Failed to insert discussions:', insertError.message);
    console.log('\nNote: This may require elevated permissions. Try using a service role key.');
    process.exit(1);
  }

  console.log(`Successfully inserted ${insertedData?.length ?? 0} sample discussions:\n`);
  insertedData?.forEach((post, i) => {
    console.log(`  ${i + 1}. ${post.title}`);
  });

  console.log('\nSeeding complete!');
}

// Run the seed function
seedDiscussions().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
