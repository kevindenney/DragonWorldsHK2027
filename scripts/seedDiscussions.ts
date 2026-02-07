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

// Kevin Denney - Main admin and moderator of the Hong Kong Dragon Worlds community
const MODERATOR_USER = {
  email: 'kevin@example.com', // Will be used to find existing user or create new
  full_name: 'Kevin Denney',
  avatar_url: null, // Can be updated later with actual avatar URL
};

// Sample comments to add to discussions
const SAMPLE_COMMENTS = [
  // Comments for "Best time to arrive" post
  {
    postIndex: 0, // Index in SAMPLE_DISCUSSIONS array
    comments: [
      { body: 'I would recommend arriving at least 3-4 days early. The jetlag from Europe was brutal last time!', upvotes: 5 },
      { body: 'Great question! Hong Kong is 8 hours ahead of GMT. Coming from the US West Coast, I needed almost a full week to feel normal.', upvotes: 3 },
      { body: 'Pro tip: Book a hotel with a pool. Light exercise helps reset your body clock faster.', upvotes: 7 },
    ],
  },
  // Comments for "Wind patterns" post
  {
    postIndex: 1,
    comments: [
      { body: 'The easterly trade winds are quite reliable in November. Expect 12-18 knots most days.', upvotes: 12 },
      { body: 'Watch out for the wind shadows from High Island. The pressure can build up and create some interesting gusts.', upvotes: 8 },
      { body: 'Local knowledge: the sea breeze usually kicks in around 11am and builds through the afternoon.', upvotes: 15 },
      { body: 'I raced there in 2019 - the current around the Nine Pins can be significant during tide changes.', upvotes: 6 },
    ],
  },
  // Comments for "Hotels near Clearwater Bay" post
  {
    postIndex: 2,
    comments: [
      { body: 'The Crowne Plaza Kowloon East is a good option - about 30 min drive to the venue but much better value.', upvotes: 4 },
      { body: 'Some teams are staying in Sai Kung town. Nice restaurants and good local vibe.', upvotes: 6 },
      { body: 'If budget allows, staying at the RHKYC is ideal - you can literally walk to your boat.', upvotes: 9 },
    ],
  },
  // Comments for "Charter boat" post
  {
    postIndex: 3,
    comments: [
      { body: 'There were a few Dragons available for charter last I checked. Contact the RHKYC fleet captain.', upvotes: 8 },
      { body: 'We are looking to split charter costs if anyone is interested. DM me!', upvotes: 2 },
    ],
  },
  // Comments for "Tidal currents" post
  {
    postIndex: 4,
    comments: [
      { body: 'The flood runs roughly northeast and the ebb runs southwest. Can be up to 2 knots at springs.', upvotes: 11 },
      { body: 'Check the Hong Kong Observatory tide tables - they are very accurate for this area.', upvotes: 7 },
    ],
  },
  // Comments for "Practice session partners" post
  {
    postIndex: 5,
    comments: [
      { body: 'Count us in! We are arriving Nov 12 and would love some practice time.', upvotes: 3 },
      { body: 'Great idea. Should we set up a WhatsApp group for practice coordination?', upvotes: 5 },
      { body: 'We are in! Will have our boat in the water by Nov 14.', upvotes: 2 },
    ],
  },
  // Comments for "Weather forecast" post
  {
    postIndex: 6,
    comments: [
      { body: 'The Hong Kong Observatory marine forecast is excellent for local conditions.', upvotes: 9 },
      { body: 'I use a combination of Windy and HKO. They complement each other well.', upvotes: 4 },
    ],
  },
  // Comments for "Equipment inspection" post
  {
    postIndex: 7,
    comments: [
      { body: 'Measurement will be on the first two days according to the draft schedule. Bring all certificates.', upvotes: 6 },
      { body: 'Make sure your sail numbers are clearly visible and correctly registered!', upvotes: 4 },
    ],
  },
  // Comments for "Transportation from airport" post
  {
    postIndex: 8,
    comments: [
      { body: 'Taxi is the easiest with sailing gear. Expect about 400-500 HKD to Clearwater Bay.', upvotes: 8 },
      { body: 'The Airport Express to Kowloon then taxi is a bit cheaper but more hassle with gear.', upvotes: 3 },
      { body: 'Uber works well in HK too. Easier for communication if you do not speak Cantonese.', upvotes: 5 },
    ],
  },
  // Comments for "Social events" post
  {
    postIndex: 9,
    comments: [
      { body: 'Sai Kung has amazing seafood restaurants. The floating restaurants are a must!', upvotes: 7 },
      { body: 'The prize giving will likely be at RHKYC. Their clubhouse is beautiful with views over the harbor.', upvotes: 4 },
    ],
  },
  // Comments for "Typhoon season" post
  {
    postIndex: 10,
    comments: [
      { body: 'November is actually the tail end of typhoon season. Risk is much lower than summer months.', upvotes: 6 },
      { body: 'RHKYC has excellent protocols for weather delays. They will keep everyone informed.', upvotes: 5 },
      { body: 'I experienced Signal 8 during a regatta in HK once. Everything just pauses until it passes.', upvotes: 3 },
    ],
  },
  // Comments for "Local sailmakers" post
  {
    postIndex: 11,
    comments: [
      { body: 'OneSails Hong Kong has good reputation for quick repairs. They know Dragons well.', upvotes: 8 },
      { body: 'There will likely be a sailmaker tent at the venue for emergency repairs during the event.', upvotes: 5 },
    ],
  },
  // Comments for "Crew looking for boat" post
  {
    postIndex: 12,
    comments: [
      { body: 'Good luck with your search! Have you posted on the IDA Facebook group too?', upvotes: 2 },
      { body: 'What positions do you prefer? We might need tactician for our team.', upvotes: 4 },
    ],
  },
  // Comments for "Food and dining" post
  {
    postIndex: 13,
    comments: [
      { body: 'Sai Kung town has the best seafood in Hong Kong. Try Chuen Kee Seafood Restaurant.', upvotes: 11 },
      { body: 'The club restaurant at RHKYC is surprisingly good and reasonably priced.', upvotes: 6 },
      { body: 'For breakfast, many teams just grab dim sum from local places. So good!', upvotes: 8 },
    ],
  },
  // Comments for "Registration reminder" post
  {
    postIndex: 14,
    comments: [
      { body: 'Already registered! Cannot wait to get back to Hong Kong racing.', upvotes: 4 },
      { body: 'Thank you for the reminder! Just submitted our entry.', upvotes: 2 },
    ],
  },
];

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

  // Step 2: Find or create the moderator user (Kevin Denney)
  console.log(`Looking up moderator user: ${MODERATOR_USER.full_name}`);

  // First try to find existing user by name
  let { data: moderator, error: userError } = await client
    .from('users')
    .select('id, full_name, avatar_url')
    .eq('full_name', MODERATOR_USER.full_name)
    .maybeSingle();

  if (userError) {
    console.warn('Could not look up user:', userError.message);
  }

  if (!moderator) {
    console.log('Moderator user not found, creating new user...');
    // Create a new user record for the moderator
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        full_name: MODERATOR_USER.full_name,
        avatar_url: MODERATOR_USER.avatar_url,
      })
      .select('id, full_name, avatar_url')
      .single();

    if (createError) {
      console.error('Failed to create moderator user:', createError.message);
      console.log('\nNote: Users table may have different structure. Proceeding without author assignment.');
      moderator = null;
    } else {
      moderator = newUser;
      console.log(`Created moderator user: ${moderator.full_name} (${moderator.id})`);
    }
  } else {
    console.log(`Found moderator user: ${moderator.full_name} (${moderator.id})`);
  }

  const moderatorId = moderator?.id ?? null;

  // Step 3: Delete existing discussions and comments for this community
  console.log('\nDeleting existing discussions and comments...');

  // First get all discussion IDs to delete their comments
  const { data: existingDiscussions } = await client
    .from('venue_discussions')
    .select('id')
    .eq('community_id', community.id);

  if (existingDiscussions && existingDiscussions.length > 0) {
    const discussionIds = existingDiscussions.map(d => d.id);

    // Delete comments for these discussions
    const { error: deleteCommentsError, count: deleteCommentsCount } = await client
      .from('venue_discussion_comments')
      .delete({ count: 'exact' })
      .in('discussion_id', discussionIds);

    if (deleteCommentsError) {
      console.warn('Could not delete comments:', deleteCommentsError.message);
    } else {
      console.log(`Deleted ${deleteCommentsCount ?? 0} existing comments.`);
    }

    // Delete votes for these discussions
    const { error: deleteVotesError } = await client
      .from('venue_discussion_votes')
      .delete()
      .in('target_id', discussionIds);

    if (deleteVotesError) {
      console.warn('Could not delete votes:', deleteVotesError.message);
    }
  }

  // Delete the discussions themselves
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

  // Step 4: Insert new sample discussions
  console.log('Inserting sample discussions...');

  const now = new Date();
  const discussionsToInsert = SAMPLE_DISCUSSIONS.map((discussion, index) => ({
    community_id: community.id,
    author_id: moderatorId, // Kevin Denney as moderator/author
    title: discussion.title,
    body: discussion.body,
    post_type: discussion.post_type,
    pinned: discussion.pinned,
    is_public: true,
    upvotes: Math.floor(Math.random() * 15) + 5, // Random upvotes 5-19
    downvotes: Math.floor(Math.random() * 3), // Random downvotes 0-2
    comment_count: 0, // Will be updated after inserting comments
    view_count: Math.floor(Math.random() * 150) + 50, // Random views 50-199
    is_resolved: false,
    created_at: new Date(now.getTime() - index * 3600000 * 8).toISOString(), // Stagger creation times (8 hours apart)
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

  // Step 5: Insert sample comments
  if (moderatorId && insertedData) {
    console.log('\nInserting sample comments...');

    let totalComments = 0;

    for (const commentGroup of SAMPLE_COMMENTS) {
      const discussion = insertedData[commentGroup.postIndex];
      if (!discussion) continue;

      for (const comment of commentGroup.comments) {
        const { error: commentError } = await client
          .from('venue_discussion_comments')
          .insert({
            discussion_id: discussion.id,
            author_id: moderatorId, // All comments from Kevin Denney for now
            body: comment.body,
            upvotes: comment.upvotes,
            downvotes: 0,
            parent_id: null,
          });

        if (commentError) {
          console.warn(`Could not insert comment for "${discussion.title}":`, commentError.message);
        } else {
          totalComments++;
        }
      }

      // Update comment count on the discussion
      const { error: updateError } = await client
        .from('venue_discussions')
        .update({ comment_count: commentGroup.comments.length })
        .eq('id', discussion.id);

      if (updateError) {
        console.warn(`Could not update comment count for "${discussion.title}":`, updateError.message);
      }
    }

    console.log(`Inserted ${totalComments} sample comments.`);
  }

  console.log('\nSeeding complete!');
}

// Run the seed function
seedDiscussions().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
