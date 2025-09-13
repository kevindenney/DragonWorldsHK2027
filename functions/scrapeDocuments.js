/**
 * Document Scraping Module for Notice Board Documents
 * Supports China Coast Race Week and Racing Rules of Sailing document extraction
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const { logger } = require('firebase-functions');

/**
 * Scrape documents from China Coast Race Week notice board
 */
async function scrapeChinaCoastRaceWeekDocuments(eventId = 'china-coast-race-week-2024') {
  logger.info('Starting China Coast Race Week document scraping...');
  
  const documents = [];
  const baseUrl = 'https://www.chinacoastraceweek.com';
  
  try {
    // Scrape main notice board page
    const noticeBoardUrl = `${baseUrl}/onb`;
    logger.info(`Fetching notice board: ${noticeBoardUrl}`);
    
    const response = await fetch(noticeBoardUrl, {
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
    
    // Extract document links - adapt selectors based on actual page structure
    const documentSelectors = [
      'a[href$=".pdf"]',
      'a[href*="document"]',
      'a[href*="sailing-instruction"]',
      'a[href*="notice"]',
      '.document-link a',
      '.notice-link a',
      '.sailing-instructions a'
    ];

    const foundLinks = new Set();

    documentSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const title = $el.text().trim() || $el.attr('title') || `Document ${index + 1}`;
        
        if (href && !foundLinks.has(href)) {
          foundLinks.add(href);
          
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          
          documents.push({
            id: `ccrw_doc_${Date.now()}_${index}`,
            eventId,
            title: cleanDocumentTitle(title),
            type: inferDocumentType(title),
            url: fullUrl,
            source: 'china-coast-race-week',
            fileType: getFileType(href),
            discoveredAt: new Date().toISOString(),
            category: categorizeDocument(title),
            priority: determinePriority(title)
          });
        }
      });
    });

    // Look for embedded documents or iframes
    $('iframe').each((index, element) => {
      const src = $(element).attr('src');
      if (src && (src.includes('pdf') || src.includes('document'))) {
        const title = $(element).attr('title') || `Embedded Document ${index + 1}`;
        documents.push({
          id: `ccrw_iframe_${Date.now()}_${index}`,
          eventId,
          title: cleanDocumentTitle(title),
          type: 'embedded_document',
          url: src.startsWith('http') ? src : `${baseUrl}${src}`,
          source: 'china-coast-race-week',
          fileType: 'pdf',
          discoveredAt: new Date().toISOString(),
          category: 'Embedded Documents',
          priority: 'medium'
        });
      }
    });

    logger.info(`Found ${documents.length} documents from China Coast Race Week`);
    return {
      documents,
      metadata: {
        source: 'china-coast-race-week',
        scrapedAt: new Date().toISOString(),
        totalFound: documents.length,
        url: noticeBoardUrl
      }
    };

  } catch (error) {
    logger.error('China Coast Race Week scraping failed:', error);
    return {
      documents: [],
      metadata: {
        source: 'china-coast-race-week',
        scrapedAt: new Date().toISOString(),
        totalFound: 0,
        error: error.message
      }
    };
  }
}

/**
 * Scrape documents from Racing Rules of Sailing
 */
async function scrapeRacingRulesDocuments(eventId = 'dragon-worlds-2027') {
  logger.info('Starting Racing Rules of Sailing document scraping...');
  
  const documents = [];
  const baseUrl = 'https://www.racingrulesofsailing.org';
  
  try {
    // Try multiple URL patterns
    const urlPatterns = [
      `${baseUrl}/event/${eventId}`,
      `${baseUrl}/documents`,
      `${baseUrl}/event/${eventId}/documents`
    ];

    for (const eventUrl of urlPatterns) {
      try {
        logger.info(`Attempting to fetch: ${eventUrl}`);
        
        const response = await fetch(eventUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          logger.warn(`Failed to fetch ${eventUrl}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract document links
        const documentSelectors = [
          'a[href$=".pdf"]',
          'a[href*="/documents/"]',
          'a[href*="/rails/active_storage/"]',
          '.document a',
          '.attachment a',
          '.download a'
        ];

        documentSelectors.forEach(selector => {
          $(selector).each((index, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            const title = $el.text().trim() || $el.attr('title') || `Document ${index + 1}`;
            
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
              
              documents.push({
                id: `rrs_doc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                eventId,
                title: cleanDocumentTitle(title),
                type: inferDocumentType(title),
                url: fullUrl,
                source: 'racing-rules-of-sailing',
                fileType: getFileType(href),
                discoveredAt: new Date().toISOString(),
                category: categorizeDocument(title),
                priority: determinePriority(title),
                sourceUrl: eventUrl
              });
            }
          });
        });

        // Look for specific sailing instructions patterns
        const sailingInstructionPatterns = [
          /sailing.*instruction/i,
          /notice.*race/i,
          /race.*document/i
        ];

        $('a').each((index, element) => {
          const $el = $(element);
          const text = $el.text().trim();
          const href = $el.attr('href');
          
          if (href && sailingInstructionPatterns.some(pattern => pattern.test(text))) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            documents.push({
              id: `rrs_si_${Date.now()}_${index}`,
              eventId,
              title: cleanDocumentTitle(text),
              type: 'sailing_instructions',
              url: fullUrl,
              source: 'racing-rules-of-sailing',
              fileType: getFileType(href),
              discoveredAt: new Date().toISOString(),
              category: 'Sailing Instructions',
              priority: 'high',
              sourceUrl: eventUrl
            });
          }
        });

        if (documents.length > 0) {
          logger.info(`Found ${documents.length} documents from ${eventUrl}`);
          break; // Stop after finding documents
        }

      } catch (error) {
        logger.warn(`Error fetching ${eventUrl}:`, error.message);
      }
    }

    return {
      documents: removeDuplicates(documents),
      metadata: {
        source: 'racing-rules-of-sailing',
        scrapedAt: new Date().toISOString(),
        totalFound: documents.length,
        eventId
      }
    };

  } catch (error) {
    logger.error('Racing Rules of Sailing scraping failed:', error);
    return {
      documents: [],
      metadata: {
        source: 'racing-rules-of-sailing',
        scrapedAt: new Date().toISOString(),
        totalFound: 0,
        error: error.message
      }
    };
  }
}

/**
 * Download and parse PDF document content
 */
async function downloadAndParsePDF(url) {
  try {
    logger.info(`Downloading PDF: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DocumentParser/1.0)'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    const buffer = await response.buffer();
    const data = await pdfParse(buffer);

    return {
      success: true,
      content: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        size: buffer.length,
        downloadedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('PDF parsing failed:', error);
    return {
      success: false,
      error: error.message,
      metadata: {
        downloadedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Extract key information from sailing instruction content
 */
function extractSailingInstructionData(content) {
  const data = {
    rules: [],
    amendments: [],
    schedules: [],
    courses: [],
    communications: [],
    penalties: [],
    protests: []
  };

  try {
    // Extract rule references
    const ruleMatches = content.match(/rule\s+\d+(\.\d+)?/gi) || [];
    data.rules = [...new Set(ruleMatches.map(rule => rule.toLowerCase()))];

    // Extract amendment information
    const amendmentMatches = content.match(/amendment\s+\d+[\s\S]*?(?=amendment|\n\n|$)/gi) || [];
    data.amendments = amendmentMatches.map((match, index) => ({
      id: `amendment_${index + 1}`,
      text: match.trim(),
      extractedAt: new Date().toISOString()
    }));

    // Extract time references
    const timeMatches = content.match(/\d{2}:\d{2}(?:\s*(?:hours?|hrs?))?/gi) || [];
    data.schedules = [...new Set(timeMatches)];

    // Extract course information
    const courseMatches = content.match(/course\s+[A-Z]|windward[- ]leeward|olympic|triangle/gi) || [];
    data.courses = [...new Set(courseMatches.map(course => course.toLowerCase()))];

    // Extract VHF channels
    const vhfMatches = content.match(/vhf\s+(?:channel\s+)?\d+/gi) || [];
    data.communications = [...new Set(vhfMatches)];

    return data;

  } catch (error) {
    logger.error('Error extracting sailing instruction data:', error);
    return data;
  }
}

/**
 * Helper function to clean document titles
 */
function cleanDocumentTitle(title) {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\(\)\[\].]/g, '')
    .trim()
    .slice(0, 200); // Limit length
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
  if (lowerTitle.includes('amendment')) return 'amendment';
  if (lowerTitle.includes('penalty')) return 'penalties';
  if (lowerTitle.includes('protest')) return 'protest';
  if (lowerTitle.includes('course')) return 'course';
  if (lowerTitle.includes('class rule')) return 'classification';
  if (lowerTitle.includes('entry') || lowerTitle.includes('registration')) return 'authorization';
  
  return 'other';
}

/**
 * Get file type from URL
 */
function getFileType(url) {
  if (url.includes('.pdf')) return 'pdf';
  if (url.includes('.doc')) return 'doc';
  if (url.includes('.html')) return 'html';
  if (url.includes('.txt')) return 'txt';
  return 'unknown';
}

/**
 * Categorize document
 */
function categorizeDocument(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('sailing instruction') || lowerTitle.includes('race instruction')) {
    return 'Sailing Instructions';
  }
  if (lowerTitle.includes('notice of race') || lowerTitle.includes('notice to competitor')) {
    return 'Official Notices';
  }
  if (lowerTitle.includes('schedule') || lowerTitle.includes('timetable')) {
    return 'Schedules';
  }
  if (lowerTitle.includes('result') || lowerTitle.includes('standing')) {
    return 'Results';
  }
  if (lowerTitle.includes('amendment') || lowerTitle.includes('change')) {
    return 'Amendments';
  }
  if (lowerTitle.includes('entry') || lowerTitle.includes('registration')) {
    return 'Registration';
  }
  
  return 'General Documents';
}

/**
 * Determine document priority
 */
function determinePriority(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('sailing instruction') || 
      lowerTitle.includes('notice of race') ||
      lowerTitle.includes('amendment')) {
    return 'high';
  }
  if (lowerTitle.includes('schedule') || 
      lowerTitle.includes('course') ||
      lowerTitle.includes('penalty')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Remove duplicate documents
 */
function removeDuplicates(documents) {
  const seen = new Set();
  return documents.filter(doc => {
    const key = `${doc.url}_${doc.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Main function to scrape all document sources
 */
async function scrapeAllDocuments(eventId = 'dragon-worlds-2027') {
  logger.info(`Starting comprehensive document scraping for event: ${eventId}`);
  
  const results = {
    documents: [],
    sources: [],
    metadata: {
      scrapedAt: new Date().toISOString(),
      eventId,
      totalDocuments: 0,
      successful: 0,
      failed: 0
    }
  };

  // Scrape from all sources in parallel
  const [ccrwResult, rrsResult] = await Promise.allSettled([
    scrapeChinaCoastRaceWeekDocuments(eventId),
    scrapeRacingRulesDocuments(eventId)
  ]);

  // Process China Coast Race Week results
  if (ccrwResult.status === 'fulfilled') {
    results.documents.push(...ccrwResult.value.documents);
    results.sources.push(ccrwResult.value.metadata);
    results.metadata.successful++;
  } else {
    results.metadata.failed++;
    results.sources.push({
      source: 'china-coast-race-week',
      error: ccrwResult.reason.message,
      scrapedAt: new Date().toISOString()
    });
  }

  // Process Racing Rules of Sailing results
  if (rrsResult.status === 'fulfilled') {
    results.documents.push(...rrsResult.value.documents);
    results.sources.push(rrsResult.value.metadata);
    results.metadata.successful++;
  } else {
    results.metadata.failed++;
    results.sources.push({
      source: 'racing-rules-of-sailing',
      error: rrsResult.reason.message,
      scrapedAt: new Date().toISOString()
    });
  }

  // Remove duplicates and sort by priority
  results.documents = removeDuplicates(results.documents);
  results.documents.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });

  results.metadata.totalDocuments = results.documents.length;
  
  logger.info(`Document scraping completed: ${results.metadata.totalDocuments} documents found from ${results.metadata.successful} sources`);
  
  return results;
}

module.exports = {
  scrapeChinaCoastRaceWeekDocuments,
  scrapeRacingRulesDocuments,
  downloadAndParsePDF,
  extractSailingInstructionData,
  scrapeAllDocuments,
  // Export helper functions for testing
  cleanDocumentTitle,
  inferDocumentType,
  categorizeDocument,
  determinePriority
};