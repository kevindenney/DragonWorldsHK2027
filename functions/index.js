/**
 * Firebase Cloud Functions for Dragon Worlds HK 2027
 * Live race data scraping from racingrulesofsailing.org
 */

const { onRequest, onSchedule } = require('firebase-functions/v2/https');
const { onSchedule: onScheduleV2 } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { scrapeRaceResults, extractOverallStandings } = require('./scrapeRaceResults');
const { scrapeCompetitorList, scrapeCompetitorDetails } = require('./scrapeCompetitors');
const { 
  scrapeAllDocuments, 
  downloadAndParsePDF, 
  extractSailingInstructionData 
} = require('./scrapeDocuments');
const { scrapeCCR2024Results, updateCCR2024Results } = require('./scrapeCCR2024Results');
const { scrapeClubSpotEntrants } = require('./scrapeClubSpot');

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTPS Cloud Function to scrape race data from racingrulesofsailing.org
 * URL: https://your-project.cloudfunctions.net/scrapeRaceData
 */
exports.scrapeRaceData = onRequest({
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '1GiB'
}, async (req, res) => {
  // Enable CORS for all origins
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { eventId, type = 'event', useCache = 'true' } = req.query;

    if (!eventId) {
      res.status(400).json({ 
        error: 'eventId parameter is required',
        usage: 'GET /scrapeRaceData?eventId=dragon-worlds-2027&type=event'
      });
      return;
    }

    logger.info(`Scraping ${type} data for event: ${eventId}`);

    // Check cache first (if enabled)
    let cachedData = null;
    if (useCache === 'true') {
      cachedData = await getCachedData(eventId, type);
      if (cachedData) {
        logger.info(`Returning cached data for ${eventId}/${type}`);
        res.status(200).json({
          ...cachedData,
          _cached: true,
          _cachedAt: cachedData._scrapedAt
        });
        return;
      }
    }

    // Scrape fresh data
    let result;
    switch (type) {
      case 'event':
        result = await scrapeEventData(eventId);
        break;
      case 'results':
        result = await scrapeEnhancedRaceResults(eventId);
        break;
      case 'documents':
        result = await scrapeEnhancedDocuments(eventId);
        break;
      case 'competitors':
        result = await scrapeEnhancedCompetitors(eventId);
        break;
      default:
        res.status(400).json({ error: 'Invalid type. Use: event, results, documents, competitors' });
        return;
    }

    // Add metadata
    result._metadata = {
      scrapedAt: new Date().toISOString(),
      eventId,
      type,
      source: 'racingrulesofsailing.org',
      function: 'Firebase Cloud Function'
    };

    // Cache the result
    if (useCache === 'true') {
      await cacheData(eventId, type, result);
    }

    logger.info(`Successfully scraped ${type} data for ${eventId}`);
    res.status(200).json(result);

  } catch (error) {
    logger.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Scraping failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get cached data from Firestore
 */
async function getCachedData(eventId, type) {
  try {
    const cacheKey = `${eventId}_${type}`;
    const doc = await db.collection('raceDataCache').doc(cacheKey).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const now = new Date();
    const cacheAge = now - data._scrapedAt.toDate();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (cacheAge > maxAge) {
      // Cache expired, delete it
      await doc.ref.delete();
      return null;
    }

    return data;
  } catch (error) {
    logger.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Cache data to Firestore
 */
async function cacheData(eventId, type, data) {
  try {
    const cacheKey = `${eventId}_${type}`;
    await db.collection('raceDataCache').doc(cacheKey).set({
      ...data,
      _scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
      _eventId: eventId,
      _type: type
    });
    logger.info(`Cached data for ${cacheKey}`);
  } catch (error) {
    logger.warn('Cache write error:', error);
  }
}

/**
 * Scrape main event data from racingrulesofsailing.org
 */
async function scrapeEventData(eventId) {
  const eventUrl = `https://www.racingrulesofsailing.org/event/${eventId}`;
  
  try {
    logger.info(`Fetching: ${eventUrl}`);
    
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseEventHTML(html, eventId);
    
  } catch (error) {
    logger.warn(`Failed to fetch event data: ${error.message}`);
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
  const patterns = [
    /<h1[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h1>/i,
    /<h1[^>]*>(.*?)<\/h1>/i,
    /<title>(.*?)<\/title>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/&[a-zA-Z0-9#]+;/g, '').replace(/<[^>]*>/g, '');
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
        logger.warn(`Invalid date format: ${match[1]} - ${match[2]}`);
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
 * Enhanced scrape race results using dedicated module
 */
async function scrapeEnhancedRaceResults(eventId) {
  try {
    // Try multiple URL patterns for China Coast Race Week
    const urlPatterns = [
      `https://www.racingrulesofsailing.org/event/${eventId}/results`,
      `https://www.racingrulesofsailing.org/event/${eventId}`,
      `https://www.chinacoastraceweek.com/results`,
      `https://rhkyc.org.hk/results/${eventId}`
    ];
    
    for (const url of urlPatterns) {
      try {
        const results = await scrapeRaceResults(eventId, url);
        if (results && (results.races.length > 0 || results.overallStandings.length > 0)) {
          logger.info(`Successfully scraped results from ${url}`);
          return results;
        }
      } catch (error) {
        logger.warn(`Failed to scrape from ${url}: ${error.message}`);
      }
    }
    
    // Return empty results if all attempts fail
    return {
      eventId,
      races: [],
      overallStandings: [],
      divisions: [],
      metadata: {
        scrapedAt: new Date().toISOString(),
        source: 'racingrulesofsailing.org',
        error: 'No results found'
      }
    };
  } catch (error) {
    logger.error('Enhanced race results scraping failed:', error);
    throw error;
  }
}

/**
 * Enhanced scrape documents using dedicated module
 */
async function scrapeEnhancedDocuments(eventId) {
  try {
    logger.info(`Starting enhanced document scraping for ${eventId}`);
    
    // Scrape documents from all sources
    const result = await scrapeAllDocuments(eventId);
    
    // Process and store documents with full content extraction
    if (result.documents.length > 0) {
      await storeDocumentsInFirestore(eventId, result.documents);
      
      // For high-priority documents, also download and parse content
      const highPriorityDocs = result.documents.filter(doc => doc.priority === 'high');
      await processHighPriorityDocuments(eventId, highPriorityDocs);
      
      logger.info(`Successfully scraped and stored ${result.documents.length} documents for ${eventId}`);
    }
    
    return result;
    
  } catch (error) {
    logger.error('Enhanced document scraping failed:', error);
    return {
      documents: [],
      sources: [],
      metadata: {
        eventId,
        scrapedAt: new Date().toISOString(),
        totalDocuments: 0,
        error: error.message
      }
    };
  }
}

/**
 * Enhanced scrape competitors using dedicated module
 */
async function scrapeEnhancedCompetitors(eventId) {
  try {
    const result = await scrapeCompetitorList(eventId);
    
    // Store in Firestore
    if (result && result.competitors.length > 0) {
      await storeCompetitorsInFirestore(eventId, result.competitors);
      logger.info(`Stored ${result.competitors.length} competitors for ${eventId}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Enhanced competitor scraping failed:', error);
    return {
      competitors: [],
      metadata: {
        eventId,
        totalEntries: 0,
        error: error.message
      }
    };
  }
}

/**
 * Store competitors in Firestore
 */
async function storeCompetitorsInFirestore(eventId, competitors) {
  const batch = db.batch();
  
  for (const competitor of competitors) {
    const docRef = db
      .collection('events')
      .doc(eventId)
      .collection('competitors')
      .doc(competitor.id || competitor.sailNumber.replace(/\s/g, '_'));
    
    batch.set(docRef, {
      ...competitor,
      eventId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  await batch.commit();
}

/**
 * Store documents in Firestore
 */
async function storeDocumentsInFirestore(eventId, documents) {
  try {
    const batch = db.batch();
    
    for (const document of documents) {
      // Store document in main documents collection
      const docRef = db
        .collection('documents')
        .doc(document.id);
      
      batch.set(docRef, {
        ...document,
        eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Also store under event-specific subcollection for easier querying
      const eventDocRef = db
        .collection('events')
        .doc(eventId)
        .collection('documents')
        .doc(document.id);
        
      batch.set(eventDocRef, {
        ...document,
        eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    logger.info(`Stored ${documents.length} documents in Firestore for ${eventId}`);
    
  } catch (error) {
    logger.error('Failed to store documents:', error);
    throw error;
  }
}

/**
 * Process high-priority documents with full content extraction
 */
async function processHighPriorityDocuments(eventId, documents) {
  try {
    logger.info(`Processing ${documents.length} high-priority documents for ${eventId}`);
    
    const batch = db.batch();
    
    for (const document of documents) {
      try {
        // Only process PDF documents for now
        if (document.fileType === 'pdf') {
          logger.info(`Downloading and parsing PDF: ${document.title}`);
          
          const pdfResult = await downloadAndParsePDF(document.url);
          
          if (pdfResult.success) {
            // Extract sailing instruction data if this is a sailing instructions document
            let extractedData = {};
            if (document.type === 'sailing_instructions') {
              extractedData = extractSailingInstructionData(pdfResult.content);
            }
            
            // Store processed document content
            const contentRef = db
              .collection('document_content')
              .doc(document.id);
              
            batch.set(contentRef, {
              documentId: document.id,
              eventId,
              content: pdfResult.content,
              extractedData,
              metadata: pdfResult.metadata,
              processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Update document with processing status
            const docRef = db.collection('documents').doc(document.id);
            batch.update(docRef, {
              contentProcessed: true,
              contentLength: pdfResult.content.length,
              processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            logger.info(`Successfully processed PDF: ${document.title} (${pdfResult.content.length} characters)`);
          } else {
            logger.warn(`Failed to process PDF: ${document.title} - ${pdfResult.error}`);
            
            // Mark document as failed processing
            const docRef = db.collection('documents').doc(document.id);
            batch.update(docRef, {
              contentProcessed: false,
              processingError: pdfResult.error,
              processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
      } catch (error) {
        logger.error(`Error processing document ${document.title}:`, error);
      }
    }
    
    await batch.commit();
    logger.info(`Completed processing high-priority documents for ${eventId}`);
    
  } catch (error) {
    logger.error('Failed to process high-priority documents:', error);
  }
}

/**
 * Scheduled function to scrape notice board data every 5 minutes
 */
exports.scheduledNoticeboardScraper = onScheduleV2({
  schedule: 'every 5 minutes',
  timeZone: 'Asia/Hong_Kong',
  memory: '512MiB',
  timeoutSeconds: 300
}, async (event) => {
  const eventId = 'dragon-worlds-2027';
  
  try {
    logger.info('Starting scheduled notice board scraping...');
    
    const notices = await scrapeNoticeBoard(eventId);
    
    // Store notices in Firestore
    await storeNoticesInFirestore(eventId, notices);
    
    logger.info(`Successfully scraped and stored ${notices.length} notices`);
    
  } catch (error) {
    logger.error('Scheduled scraping failed:', error);
  }
});

/**
 * HTTP function to manually trigger notice board scraping
 */
exports.scrapeNoticeBoard = onRequest({
  cors: true,
  maxInstances: 5,
  timeoutSeconds: 60,
  memory: '512MiB'
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  try {
    const { eventId = 'dragon-worlds-2027' } = req.query;
    
    logger.info(`Manual notice board scraping for event: ${eventId}`);
    
    const notices = await scrapeNoticeBoard(eventId);
    await storeNoticesInFirestore(eventId, notices);
    
    res.status(200).json({
      success: true,
      noticesCount: notices.length,
      notices: notices,
      scrapedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Manual scraping failed:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * HTTP function to manually trigger document scraping
 */
exports.scrapeDocuments = onRequest({
  cors: true,
  maxInstances: 5,
  timeoutSeconds: 120,
  memory: '1GiB'
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  try {
    const { eventId = 'dragon-worlds-2027', processContent = 'true' } = req.query;
    
    logger.info(`Manual document scraping for event: ${eventId}`);
    
    const result = await scrapeEnhancedDocuments(eventId);
    
    res.status(200).json({
      success: true,
      eventId,
      documentsFound: result.documents.length,
      sources: result.sources.length,
      metadata: result.metadata,
      documents: result.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        category: doc.category,
        priority: doc.priority,
        source: doc.source,
        url: doc.url
      })),
      scrapedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Manual document scraping failed:', error);
    res.status(500).json({
      error: 'Document scraping failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Scrape notice board data from racingrulesofsailing.org
 */
async function scrapeNoticeBoard(eventId) {
  const eventUrl = `https://www.racingrulesofsailing.org/event/${eventId}`;
  
  try {
    logger.info(`Scraping notice board from: ${eventUrl}`);
    
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const notices = [];
    
    // Extract official notifications
    notices.push(...extractOfficialNotifications($, eventId));
    
    // Extract protest information
    notices.push(...extractProtestNotices($, eventId));
    
    // Extract course changes
    notices.push(...extractCourseChanges($, eventId));
    
    // Extract weather notices
    notices.push(...extractWeatherNotices($, eventId));
    
    // Extract general announcements
    notices.push(...extractGeneralAnnouncements($, eventId));
    
    logger.info(`Extracted ${notices.length} notices from notice board`);
    return notices;
    
  } catch (error) {
    logger.error('Notice board scraping failed:', error);
    return [];
  }
}

/**
 * Extract official notifications from HTML
 */
function extractOfficialNotifications($, eventId) {
  const notices = [];
  
  // Look for official notification sections
  const notificationSelectors = [
    '.notice-board .notification',
    '.official-notices .notice',
    '.announcements .announcement',
    '.notice-section .notice-item'
  ];
  
  notificationSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const title = $el.find('h3, h4, .title, .notice-title').first().text().trim();
      const content = $el.find('p, .content, .notice-content').first().text().trim();
      const publishedText = $el.find('.date, .published, .timestamp').first().text().trim();
      
      if (title && content) {
        notices.push({
          id: `notice_${eventId}_${Date.now()}_${index}`,
          eventId,
          type: 'announcement',
          priority: determinePriority(title, content),
          title,
          content,
          publishedAt: parseNoticeDate(publishedText),
          author: 'Race Committee',
          authorRole: 'race_committee',
          tags: extractTags(title, content),
          sourceUrl: `https://www.racingrulesofsailing.org/event/${eventId}`,
          scrapedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return notices;
}

/**
 * Extract protest notices from HTML
 */
function extractProtestNotices($, eventId) {
  const notices = [];
  
  const protestSelectors = [
    '.protest-section .protest',
    '.protests .protest-item',
    '.hearings .hearing'
  ];
  
  protestSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const title = $el.find('h3, h4, .title').first().text().trim();
      const content = $el.find('p, .content').first().text().trim();
      const timeText = $el.find('.time, .hearing-time').first().text().trim();
      
      if (title && (title.toLowerCase().includes('protest') || title.toLowerCase().includes('hearing'))) {
        notices.push({
          id: `protest_${eventId}_${Date.now()}_${index}`,
          eventId,
          type: 'protest',
          priority: 'normal',
          title,
          content,
          publishedAt: parseNoticeDate(timeText),
          author: 'Protest Committee',
          authorRole: 'protest_committee',
          tags: ['protest', 'hearing'],
          sourceUrl: `https://www.racingrulesofsailing.org/event/${eventId}`,
          scrapedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return notices;
}

/**
 * Extract course change notices
 */
function extractCourseChanges($, eventId) {
  const notices = [];
  
  const courseSelectors = [
    '.course-changes .change',
    '.race-info .course-info',
    '.sailing-instructions .amendment'
  ];
  
  courseSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const title = $el.find('h3, h4, .title').first().text().trim();
      const content = $el.find('p, .content').first().text().trim();
      
      if (title && (title.toLowerCase().includes('course') || title.toLowerCase().includes('change'))) {
        notices.push({
          id: `course_${eventId}_${Date.now()}_${index}`,
          eventId,
          type: 'course_change',
          priority: 'high',
          title,
          content,
          publishedAt: new Date().toISOString(),
          author: 'Race Committee',
          authorRole: 'race_committee',
          tags: ['course', 'change'],
          sourceUrl: `https://www.racingrulesofsailing.org/event/${eventId}`,
          scrapedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return notices;
}

/**
 * Extract weather notices
 */
function extractWeatherNotices($, eventId) {
  const notices = [];
  
  const weatherSelectors = [
    '.weather-notice',
    '.weather-warning',
    '.conditions .warning'
  ];
  
  weatherSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const title = $el.find('h3, h4, .title').first().text().trim();
      const content = $el.find('p, .content').first().text().trim();
      
      if (title && (title.toLowerCase().includes('weather') || title.toLowerCase().includes('wind'))) {
        notices.push({
          id: `weather_${eventId}_${Date.now()}_${index}`,
          eventId,
          type: 'weather',
          priority: determineWeatherPriority(title, content),
          title,
          content,
          publishedAt: new Date().toISOString(),
          author: 'Race Committee',
          authorRole: 'race_committee',
          tags: ['weather', 'conditions'],
          sourceUrl: `https://www.racingrulesofsailing.org/event/${eventId}`,
          scrapedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return notices;
}

/**
 * Extract general announcements
 */
function extractGeneralAnnouncements($, eventId) {
  const notices = [];
  
  // Look for general text content that might be announcements
  const textSelectors = [
    '.content p',
    '.description p',
    '.event-info p'
  ];
  
  textSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      // Only include substantial text that looks like announcements
      if (text.length > 100 && (
        text.toLowerCase().includes('notice') ||
        text.toLowerCase().includes('announcement') ||
        text.toLowerCase().includes('important') ||
        text.toLowerCase().includes('attention')
      )) {
        notices.push({
          id: `announcement_${eventId}_${Date.now()}_${index}`,
          eventId,
          type: 'announcement',
          priority: 'normal',
          title: text.substring(0, 100) + '...',
          content: text,
          publishedAt: new Date().toISOString(),
          author: 'Event Organizers',
          authorRole: 'organizer',
          tags: ['general'],
          sourceUrl: `https://www.racingrulesofsailing.org/event/${eventId}`,
          scrapedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return notices.slice(0, 5); // Limit general announcements
}

/**
 * Store notices in Firestore and trigger notifications
 */
async function storeNoticesInFirestore(eventId, notices) {
  const batch = db.batch();
  const newNotices = [];
  
  for (const notice of notices) {
    // Check if notice already exists to avoid duplicates
    const existingDoc = await db.collection('notices').doc(notice.id).get();
    
    if (!existingDoc.exists) {
      const noticeRef = db.collection('notices').doc(notice.id);
      batch.set(noticeRef, {
        ...notice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      newNotices.push(notice);
    }
  }
  
  await batch.commit();
  logger.info(`Stored ${notices.length} notices in Firestore`);
  
  // Send push notifications for urgent notices
  for (const notice of newNotices) {
    if (notice.priority === 'emergency' || notice.priority === 'urgent') {
      await sendEmergencyNotification(notice);
    }
  }
}

/**
 * Send push notification for emergency notices
 */
async function sendEmergencyNotification(notice) {
  try {
    // Get all user tokens (in a real app, you'd want to filter by user preferences)
    const usersSnapshot = await db.collection('users').get();
    const tokens = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken && userData.notificationsEnabled !== false) {
        tokens.push(userData.fcmToken);
      }
    });
    
    if (tokens.length === 0) {
      logger.info('No FCM tokens found for emergency notification');
      return;
    }
    
    const message = {
      notification: {
        title: `🚨 ${notice.title}`,
        body: notice.content.substring(0, 200) + (notice.content.length > 200 ? '...' : ''),
      },
      data: {
        noticeId: notice.id,
        eventId: notice.eventId,
        type: notice.type,
        priority: notice.priority
      },
      android: {
        notification: {
          channelId: 'emergency_notices',
          priority: 'high',
          sound: 'default',
          vibrate: [0, 250, 250, 250]
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `🚨 ${notice.title}`,
              body: notice.content.substring(0, 200) + (notice.content.length > 200 ? '...' : ''),
            },
            sound: 'default',
            badge: 1,
            'content-available': 1
          }
        }
      },
      tokens: tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Sent emergency notification to ${response.successCount} devices for notice: ${notice.title}`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`Failed to send notification to token ${tokens[idx]}: ${resp.error}`);
        }
      });
    }
    
  } catch (error) {
    logger.error('Error sending emergency notification:', error);
  }
}

/**
 * Determine priority based on content
 */
function determinePriority(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('emergency') || text.includes('urgent') || text.includes('immediate')) {
    return 'emergency';
  }
  if (text.includes('important') || text.includes('warning') || text.includes('attention')) {
    return 'high';
  }
  if (text.includes('notice') || text.includes('change') || text.includes('update')) {
    return 'normal';
  }
  
  return 'info';
}

/**
 * Determine weather priority
 */
function determineWeatherPriority(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('warning') || text.includes('severe') || text.includes('dangerous')) {
    return 'emergency';
  }
  if (text.includes('strong') || text.includes('high') || text.includes('caution')) {
    return 'high';
  }
  
  return 'normal';
}

/**
 * Extract tags from content
 */
function extractTags(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  const tags = [];
  
  const tagKeywords = {
    'schedule': ['schedule', 'time', 'timing'],
    'safety': ['safety', 'warning', 'caution'],
    'weather': ['weather', 'wind', 'conditions'],
    'protest': ['protest', 'hearing', 'penalty'],
    'course': ['course', 'marks', 'sailing'],
    'registration': ['registration', 'entry', 'payment'],
    'results': ['results', 'scoring', 'standings']
  };
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['general'];
}

/**
 * Parse notice date from text
 */
function parseNoticeDate(dateText) {
  if (!dateText) return new Date().toISOString();
  
  try {
    const parsed = new Date(dateText);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Store race results in Firestore
 */
async function storeRaceResultsInFirestore(eventId, results) {
  try {
    // Store overall results document
    await db.collection('events').doc(eventId).set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalRaces: results.metadata?.totalRaces || 0,
      completedRaces: results.metadata?.completedRaces || 0,
      totalCompetitors: results.metadata?.totalCompetitors || 0
    }, { merge: true });
    
    // Store individual race results
    const raceBatch = db.batch();
    for (const race of results.races || []) {
      const raceRef = db
        .collection('events')
        .doc(eventId)
        .collection('races')
        .doc(`race_${race.raceNumber}`);
      
      raceBatch.set(raceRef, {
        ...race,
        eventId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await raceBatch.commit();
    
    // Store overall standings
    const standingsBatch = db.batch();
    for (const standing of results.overallStandings || []) {
      const standingRef = db
        .collection('events')
        .doc(eventId)
        .collection('standings')
        .doc(standing.sailNumber.replace(/\s/g, '_'));
      
      standingsBatch.set(standingRef, {
        ...standing,
        eventId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await standingsBatch.commit();
    
    logger.info(`Stored ${results.races?.length || 0} races and ${results.overallStandings?.length || 0} standings for ${eventId}`);
    
  } catch (error) {
    logger.error('Failed to store race results:', error);
    throw error;
  }
}

/**
 * HTTP function to scrape and store complete race data
 */
exports.syncRaceData = onRequest({
  cors: true,
  maxInstances: 5,
  timeoutSeconds: 120,
  memory: '1GiB'
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }
  
  try {
    const { eventId = 'china-coast-race-week-2024' } = req.query;
    
    logger.info(`Starting complete race data sync for ${eventId}`);
    
    // Scrape all data types in parallel
    const [eventData, results, competitors, notices, documents] = await Promise.all([
      scrapeEventData(eventId),
      scrapeEnhancedRaceResults(eventId),
      scrapeEnhancedCompetitors(eventId),
      scrapeNoticeBoard(eventId),
      scrapeEnhancedDocuments(eventId)
    ]);
    
    // Store all data in Firestore
    await Promise.all([
      storeRaceResultsInFirestore(eventId, results),
      storeCompetitorsInFirestore(eventId, competitors.competitors),
      storeNoticesInFirestore(eventId, notices),
      storeDocumentsInFirestore(eventId, documents.documents)
    ]);
    
    res.status(200).json({
      success: true,
      eventId,
      summary: {
        eventName: eventData.name,
        races: results.races?.length || 0,
        standings: results.overallStandings?.length || 0,
        competitors: competitors.competitors?.length || 0,
        notices: notices.length || 0,
        documents: documents.documents?.length || 0
      },
      syncedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Race data sync failed:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Scheduled function to sync race data every 10 minutes during race days
 */
exports.scheduledRaceDataSync = onScheduleV2({
  schedule: 'every 10 minutes',
  timeZone: 'Asia/Hong_Kong',
  memory: '1GiB',
  timeoutSeconds: 300
}, async (event) => {
  const eventIds = [
    'dragon-worlds-2027',
    'china-coast-race-week-2024',
    'rhkyc-autumn-regatta-2024'
  ];
  
  try {
    logger.info('Starting scheduled race data sync...');
    
    for (const eventId of eventIds) {
      try {
        const results = await scrapeEnhancedRaceResults(eventId);
        await storeRaceResultsInFirestore(eventId, results);
        logger.info(`Synced results for ${eventId}`);
      } catch (error) {
        logger.error(`Failed to sync ${eventId}:`, error);
      }
    }
    
    logger.info('Scheduled race data sync completed');
    
  } catch (error) {
    logger.error('Scheduled sync failed:', error);
  }
});

// Export CCR 2024 specific functions
// Note: scrapeCCR2024Results is temporarily disabled due to a stuck deployment
// exports.scrapeCCR2024Results = scrapeCCR2024Results;
exports.updateCCR2024Results = updateCCR2024Results;

// Export ClubSpot entrant scraping function
exports.scrapeClubSpotEntrants = scrapeClubSpotEntrants;