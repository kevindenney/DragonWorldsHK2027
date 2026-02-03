/**
 * Event documents scraping module for racingrulesofsailing.org
 * Scrapes notice board documents, schedules, and decisions
 *
 * Event IDs:
 * - APAC 2026: 13241
 * - Worlds 2027: 13242
 */

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { logger } = require('firebase-functions');

// Event configuration
const EVENT_CONFIG = {
  '13241': {
    name: 'Hong Kong Dragon Asia Pacific Championship 2026',
    shortName: 'APAC 2026',
    baseUrl: 'https://www.racingrulesofsailing.org',
    documentsUrl: 'https://www.racingrulesofsailing.org/documents/13241/event',
    schedulesUrl: 'https://www.racingrulesofsailing.org/schedules/13241/event',
    decisionsUrl: 'https://www.racingrulesofsailing.org/decisions/13241/event',
    forms: {
      question: 'https://www.racingrulesofsailing.org/questions/new?event_id=13241',
      crewSubstitution: 'https://www.racingrulesofsailing.org/crew_substitutions/new?event_id=13241',
      equipmentSubstitution: 'https://www.racingrulesofsailing.org/equipment_substitutions/new?event_id=13241',
      scoringInquiry: 'https://www.racingrulesofsailing.org/scoring_inquiries/new?event_id=13241',
      protest: 'https://www.racingrulesofsailing.org/protests/new?event_id=13241',
    },
  },
  '13242': {
    name: 'Hong Kong Dragon World Championship 2027',
    shortName: 'Worlds 2027',
    baseUrl: 'https://www.racingrulesofsailing.org',
    documentsUrl: 'https://www.racingrulesofsailing.org/documents/13242/event',
    schedulesUrl: 'https://www.racingrulesofsailing.org/schedules/13242/event',
    decisionsUrl: 'https://www.racingrulesofsailing.org/decisions/13242/event',
    forms: {
      question: 'https://www.racingrulesofsailing.org/questions/new?event_id=13242',
      crewSubstitution: 'https://www.racingrulesofsailing.org/crew_substitutions/new?event_id=13242',
      equipmentSubstitution: 'https://www.racingrulesofsailing.org/equipment_substitutions/new?event_id=13242',
      scoringInquiry: 'https://www.racingrulesofsailing.org/scoring_inquiries/new?event_id=13242',
      protest: 'https://www.racingrulesofsailing.org/protests/new?event_id=13242',
    },
  },
};

/**
 * HTTP request headers for scraping
 */
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Cache-Control': 'no-cache',
};

/**
 * Scrape all event documents from notice board page
 */
async function scrapeEventDocuments(eventId) {
  const config = EVENT_CONFIG[eventId];
  if (!config) {
    throw new Error(`Unknown event ID: ${eventId}. Valid IDs: ${Object.keys(EVENT_CONFIG).join(', ')}`);
  }

  logger.info(`Scraping documents for event ${eventId}: ${config.name}`);

  try {
    const response = await fetch(config.documentsUrl, { headers: REQUEST_HEADERS });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const documents = extractDocuments($, config.baseUrl);

    logger.info(`Extracted ${documents.length} documents for event ${eventId}`);

    return {
      eventId,
      eventName: config.name,
      shortName: config.shortName,
      documents,
      forms: config.forms,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Document scraping failed for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Extract documents from the page
 */
function extractDocuments($, baseUrl) {
  const documents = [];

  // Look for document links in various table formats
  const documentSelectors = [
    'table.documents tr',
    '.document-list tr',
    'table tr',
    '.notice-board-item',
  ];

  documentSelectors.forEach((selector) => {
    $(selector).each((index, row) => {
      const $row = $(row);

      // Skip header rows
      if ($row.find('th').length > 0) return;

      // Extract document info
      const linkElement = $row.find('a[href*=".pdf"], a[href*="/documents/"]').first();
      if (!linkElement.length) return;

      const href = linkElement.attr('href');
      const title = linkElement.text().trim() || extractTitleFromRow($row);

      if (!href || !title) return;

      // Build full URL
      const url = href.startsWith('http') ? href : `${baseUrl}${href}`;

      // Extract date
      const dateCell = $row.find('td:contains("/"), td:contains("-")').first();
      const publishedAt = extractDate(dateCell.text());

      // Determine document type
      const type = categorizeDocument(title);

      documents.push({
        id: `doc_${index}_${Date.now()}`,
        title,
        type,
        url,
        fileType: url.includes('.pdf') ? 'pdf' : 'html',
        publishedAt,
        isRequired: isRequiredDocument(type),
        category: getCategoryForType(type),
      });
    });
  });

  // Also look for standalone PDF links
  $('a[href$=".pdf"]').each((index, link) => {
    const $link = $(link);
    const href = $link.attr('href');
    const title = $link.text().trim();

    // Skip if already captured or no meaningful title
    if (!title || title.length < 3) return;

    const url = href.startsWith('http') ? href : `${baseUrl}${href}`;

    // Check if we already have this document
    if (documents.some((d) => d.url === url)) return;

    const type = categorizeDocument(title);

    documents.push({
      id: `doc_pdf_${index}_${Date.now()}`,
      title,
      type,
      url,
      fileType: 'pdf',
      publishedAt: new Date().toISOString(),
      isRequired: isRequiredDocument(type),
      category: getCategoryForType(type),
    });
  });

  return documents;
}

/**
 * Extract title from table row when link text is insufficient
 */
function extractTitleFromRow($row) {
  const cells = $row.find('td');
  for (let i = 0; i < cells.length; i++) {
    const text = cells.eq(i).text().trim();
    if (text.length > 5 && !text.match(/^\d+$/) && !text.match(/^\d{1,2}[/-]\d{1,2}/)) {
      return text;
    }
  }
  return '';
}

/**
 * Extract date from text
 */
function extractDate(text) {
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/,
    /(\d{1,2}\s+\w+\s+\d{4})/,
    /(\w+\s+\d{1,2},?\s+\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        // Invalid date
      }
    }
  }

  return new Date().toISOString();
}

/**
 * Categorize document based on title
 */
function categorizeDocument(title) {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('notice of race') || lowerTitle.includes('nor')) {
    return 'notice_of_race';
  }
  if (lowerTitle.includes('sailing instruction') || lowerTitle.includes('si ')) {
    return 'sailing_instructions';
  }
  if (lowerTitle.includes('schedule') || lowerTitle.includes('programme')) {
    return 'race_schedule';
  }
  if (lowerTitle.includes('result') || lowerTitle.includes('standing')) {
    return 'results';
  }
  if (lowerTitle.includes('course') || lowerTitle.includes('mark')) {
    return 'course_info';
  }
  if (lowerTitle.includes('entry') || lowerTitle.includes('registration')) {
    return 'entry_form';
  }
  if (lowerTitle.includes('protest') || lowerTitle.includes('hearing')) {
    return 'protest_info';
  }
  if (lowerTitle.includes('decision') || lowerTitle.includes('ruling')) {
    return 'decisions';
  }
  if (lowerTitle.includes('amendment') || lowerTitle.includes('change')) {
    return 'rule_amendments';
  }
  if (lowerTitle.includes('safety') || lowerTitle.includes('emergency')) {
    return 'safety_notice';
  }
  if (lowerTitle.includes('measurement') || lowerTitle.includes('equipment')) {
    return 'measurement_requirements';
  }
  if (lowerTitle.includes('weather') || lowerTitle.includes('forecast')) {
    return 'weather_forecast';
  }

  return 'general_notices';
}

/**
 * Check if document type is required reading
 */
function isRequiredDocument(type) {
  const requiredTypes = [
    'notice_of_race',
    'sailing_instructions',
    'rule_amendments',
    'safety_notice',
  ];
  return requiredTypes.includes(type);
}

/**
 * Get category for document type
 */
function getCategoryForType(type) {
  const categoryMap = {
    notice_of_race: 'Official Documents',
    sailing_instructions: 'Official Documents',
    race_schedule: 'Schedules',
    results: 'Results',
    course_info: 'Race Information',
    entry_form: 'Registration',
    protest_info: 'Protests & Hearings',
    decisions: 'Protests & Hearings',
    rule_amendments: 'Rules',
    safety_notice: 'Safety',
    measurement_requirements: 'Equipment',
    weather_forecast: 'Weather',
    general_notices: 'General',
  };
  return categoryMap[type] || 'General';
}

/**
 * Scrape hearing decisions from decisions page
 */
async function scrapeDecisions(eventId) {
  const config = EVENT_CONFIG[eventId];
  if (!config) {
    throw new Error(`Unknown event ID: ${eventId}`);
  }

  logger.info(`Scraping decisions for event ${eventId}`);

  try {
    const response = await fetch(config.decisionsUrl, { headers: REQUEST_HEADERS });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const decisions = [];

    // Extract decisions from tables or lists
    $('table tr, .decision-item, .hearing-decision').each((index, element) => {
      const $el = $(element);

      // Skip headers
      if ($el.find('th').length > 0) return;

      const linkElement = $el.find('a').first();
      const title = linkElement.text().trim() || $el.text().trim();
      const href = linkElement.attr('href');

      if (!title || title.length < 5) return;

      decisions.push({
        id: `decision_${index}_${Date.now()}`,
        title,
        url: href ? (href.startsWith('http') ? href : `${config.baseUrl}${href}`) : null,
        publishedAt: extractDate($el.text()),
        status: title.toLowerCase().includes('final') ? 'final' : 'published',
      });
    });

    logger.info(`Extracted ${decisions.length} decisions for event ${eventId}`);

    return {
      eventId,
      eventName: config.name,
      decisions,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Decisions scraping failed for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Scrape race schedule from schedules page
 */
async function scrapeSchedule(eventId) {
  const config = EVENT_CONFIG[eventId];
  if (!config) {
    throw new Error(`Unknown event ID: ${eventId}`);
  }

  logger.info(`Scraping schedule for event ${eventId}`);

  try {
    const response = await fetch(config.schedulesUrl, { headers: REQUEST_HEADERS });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const schedule = [];

    // Extract schedule items
    $('table tr, .schedule-item, .race-schedule').each((index, element) => {
      const $el = $(element);

      // Skip headers
      if ($el.find('th').length > 0) return;

      const cells = $el.find('td');
      if (cells.length < 2) return;

      const time = cells.eq(0).text().trim();
      const description = cells.eq(1).text().trim();

      if (!description) return;

      // Extract race number if present
      const raceMatch = description.match(/Race\s*(\d+)/i);
      const raceNumber = raceMatch ? parseInt(raceMatch[1]) : null;

      schedule.push({
        id: `schedule_${index}_${Date.now()}`,
        time,
        description,
        raceNumber,
        date: extractDate($el.text()),
      });
    });

    logger.info(`Extracted ${schedule.length} schedule items for event ${eventId}`);

    return {
      eventId,
      eventName: config.name,
      schedule,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Schedule scraping failed for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Get all event data (documents, schedule, decisions)
 */
async function scrapeAllEventData(eventId) {
  const [documents, schedule, decisions] = await Promise.all([
    scrapeEventDocuments(eventId).catch((e) => ({ error: e.message, documents: [] })),
    scrapeSchedule(eventId).catch((e) => ({ error: e.message, schedule: [] })),
    scrapeDecisions(eventId).catch((e) => ({ error: e.message, decisions: [] })),
  ]);

  const config = EVENT_CONFIG[eventId];

  return {
    eventId,
    eventName: config?.name || 'Unknown Event',
    shortName: config?.shortName || eventId,
    documents: documents.documents || [],
    schedule: schedule.schedule || [],
    decisions: decisions.decisions || [],
    forms: config?.forms || {},
    lastUpdated: new Date().toISOString(),
    errors: {
      documents: documents.error,
      schedule: schedule.error,
      decisions: decisions.error,
    },
  };
}

module.exports = {
  scrapeEventDocuments,
  scrapeDecisions,
  scrapeSchedule,
  scrapeAllEventData,
  EVENT_CONFIG,
};
