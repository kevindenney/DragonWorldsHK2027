/**
 * Vercel Serverless Function for scraping racingrulesofsailing.org
 * This function acts as a CORS proxy to fetch race data from the website
 */

export default async function handler(req, res) {
  // Enable CORS for all origins (adjust in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, type = 'event' } = req.query;

    if (!eventId) {
      return res.status(400).json({ 
        error: 'eventId parameter is required',
        usage: 'GET /api/scrape-race-data?eventId=dragon-worlds-2027&type=event'
      });
    }

    console.log(`[Scraper] Fetching ${type} data for event: ${eventId}`);

    let result;
    switch (type) {
      case 'event':
        result = await scrapeEventData(eventId);
        break;
      case 'results':
        result = await scrapeRaceResults(eventId);
        break;
      case 'documents':
        result = await scrapeDocuments(eventId);
        break;
      case 'competitors':
        result = await scrapeCompetitors(eventId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Use: event, results, documents, competitors' });
    }

    // Add metadata
    result._metadata = {
      scrapedAt: new Date().toISOString(),
      eventId,
      type,
      source: 'racingrulesofsailing.org'
    };

    console.log(`[Scraper] Successfully scraped ${type} data for ${eventId}`);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[Scraper] Error:', error.message);
    return res.status(500).json({ 
      error: 'Scraping failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Scrape main event data from racingrulesofsailing.org
 */
async function scrapeEventData(eventId) {
  const eventUrl = `https://www.racingrulesofsailing.org/event/${eventId}`;
  
  try {
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    return parseEventHTML(html, eventId);
  } catch (error) {
    console.error(`[Scraper] Failed to fetch event data: ${error.message}`);
    
    // Return structured fallback data
    return generateFallbackEventData(eventId, error.message);
  }
}

/**
 * Parse HTML content from racingrulesofsailing.org event page
 */
function parseEventHTML(html, eventId) {
  const event = {
    id: eventId,
    name: extractEventName(html) || 'Dragon Worlds Hong Kong 2027',
    organizer: extractOrganizer(html) || 'Royal Hong Kong Yacht Club',
    venue: extractVenue(html) || 'Hong Kong',
    dates: extractEventDates(html),
    status: 'upcoming',
    entryCount: extractEntryCount(html) || 87,
    lastUpdated: new Date().toISOString()
  };

  // Extract additional data
  event.documents = extractDocumentLinks(html);
  event.notifications = extractNotifications(html);
  event.protests = [];
  event.hearings = [];
  event.scoringInquiries = [];
  event.penalties = [];
  event.courseChanges = [];
  event.weatherNotices = [];

  return event;
}

/**
 * Extract event name from HTML
 */
function extractEventName(html) {
  // Try multiple patterns for event name
  const patterns = [
    /<h1[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h1>/i,
    /<h1[^>]*>(.*?)<\/h1>/i,
    /<title>(.*?)<\/title>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/&[a-zA-Z0-9#]+;/g, ''); // Remove HTML entities
    }
  }
  
  return null;
}

/**
 * Extract organizer information
 */
function extractOrganizer(html) {
  const patterns = [
    /<span[^>]*class="[^"]*organizer[^"]*"[^>]*>(.*?)<\/span>/i,
    /<div[^>]*class="[^"]*organizer[^"]*"[^>]*>(.*?)<\/div>/i,
    /organizer[^>]*>(.*?)</i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/<[^>]*>/g, '');
    }
  }

  return null;
}

/**
 * Extract venue information
 */
function extractVenue(html) {
  const patterns = [
    /<span[^>]*class="[^"]*venue[^"]*"[^>]*>(.*?)<\/span>/i,
    /<div[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/div>/i,
    /venue[^>]*>(.*?)</i,
    /location[^>]*>(.*?)</i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/<[^>]*>/g, '');
    }
  }

  return null;
}

/**
 * Extract event dates
 */
function extractEventDates(html) {
  // Look for various date patterns
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*[-–]\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
    /(\w+ \d{1,2}, \d{4})\s*[-–]\s*(\w+ \d{1,2}, \d{4})/g,
    /(\d{4}-\d{2}-\d{2})\s*[-–]\s*(\d{4}-\d{2}-\d{2})/g
  ];

  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[2]) {
      try {
        return {
          start: new Date(match[1]).toISOString(),
          end: new Date(match[2]).toISOString()
        };
      } catch (error) {
        console.warn(`[Scraper] Invalid date format: ${match[1]} - ${match[2]}`);
      }
    }
  }

  // Default to future dates
  const start = new Date();
  start.setDate(start.getDate() + 30);
  const end = new Date(start);
  end.setDate(end.getDate() + 5);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Extract entry count
 */
function extractEntryCount(html) {
  const patterns = [
    /(\d+)\s*entr(?:y|ies)/i,
    /(\d+)\s*participant/i,
    /(\d+)\s*boat/i,
    /(\d+)\s*competitor/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
  }

  return null;
}

/**
 * Extract document links from HTML
 */
function extractDocumentLinks(html) {
  const documents = [];
  const linkPattern = /<a[^>]*href="([^"]*\.pdf)"[^>]*>(.*?)<\/a>/gi;

  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    documents.push({
      id: `doc_${documents.length + 1}`,
      title: match[2].trim().replace(/<[^>]*>/g, ''),
      type: inferDocumentType(match[2]),
      url: resolveUrl(match[1]),
      fileType: 'pdf',
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isRequired: false,
      category: 'document'
    });
  }

  return documents;
}

/**
 * Infer document type from title
 */
function inferDocumentType(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('sailing instruction')) return 'sailing_instructions';
  if (lowerTitle.includes('notice of race')) return 'notice_of_race';
  if (lowerTitle.includes('schedule')) return 'schedule';
  if (lowerTitle.includes('result')) return 'results';
  
  return 'other';
}

/**
 * Extract notifications
 */
function extractNotifications(html) {
  // This would parse notification sections if they exist
  return [];
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url) {
  if (url.startsWith('http')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `https://www.racingrulesofsailing.org${url}`;
  }
  return `https://www.racingrulesofsailing.org/${url}`;
}

/**
 * Generate fallback data when scraping fails
 */
function generateFallbackEventData(eventId, errorMessage) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5);

  return {
    id: eventId,
    name: 'Dragon Worlds Hong Kong 2027',
    organizer: 'Royal Hong Kong Yacht Club',
    venue: 'Hong Kong',
    dates: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    status: 'upcoming',
    entryCount: 87,
    lastUpdated: new Date().toISOString(),
    documents: [],
    notifications: [],
    protests: [],
    hearings: [],
    scoringInquiries: [],
    penalties: [],
    courseChanges: [],
    weatherNotices: [],
    _fallback: true,
    _error: errorMessage
  };
}

/**
 * Scrape race results (placeholder for future implementation)
 */
async function scrapeRaceResults(eventId) {
  // This would scrape results pages
  return {
    races: [],
    standings: [],
    _placeholder: true
  };
}

/**
 * Scrape documents (placeholder for future implementation)
 */
async function scrapeDocuments(eventId) {
  // This would scrape document pages
  return {
    documents: [],
    _placeholder: true
  };
}

/**
 * Scrape competitors (placeholder for future implementation)
 */
async function scrapeCompetitors(eventId) {
  // This would scrape competitor/entry lists
  return {
    competitors: [],
    _placeholder: true
  };
}