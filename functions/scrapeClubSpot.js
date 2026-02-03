/**
 * ClubSpot Entry List Scraper
 *
 * Firebase Cloud Function to fetch entrant data from ClubSpot regattas.
 * ClubSpot uses Vue.js/Parse.js which loads data dynamically, so we use
 * Puppeteer to render the page and extract the entry list data.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const axios = require('axios');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Initialize Firebase Admin if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Main Cloud Function to scrape ClubSpot entrants
 */
exports.scrapeClubSpotEntrants = onRequest({
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 120,
  memory: '2GiB',  // Required for Chromium
  cpu: 1,
  invoker: 'public'  // Allow unauthenticated access
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
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
    const { regattaId, useCache = 'true' } = req.query;

    if (!regattaId) {
      res.status(400).json({
        error: 'regattaId parameter is required',
        usage: 'GET /scrapeClubSpotEntrants?regattaId=p75RuY5UZc'
      });
      return;
    }

    logger.info(`[ClubSpot] Fetching entrants for regatta: ${regattaId}`);

    // Check cache first
    if (useCache === 'true') {
      const cachedData = await getCachedEntrants(regattaId);
      if (cachedData) {
        logger.info(`[ClubSpot] Returning cached data for ${regattaId}`);
        res.status(200).json({
          ...cachedData,
          _cached: true,
          _cacheAge: Date.now() - cachedData._fetchedAt
        });
        return;
      }
    }

    // Fetch fresh data from ClubSpot
    const result = await fetchClubSpotEntrants(regattaId);

    // Cache the result
    if (useCache === 'true' && result.success) {
      await cacheEntrants(regattaId, result);
    }

    res.status(200).json(result);

  } catch (error) {
    logger.error('[ClubSpot] Scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entrants',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Fetch entrant data from ClubSpot using Puppeteer
 * ClubSpot loads data dynamically via Vue.js, so we need a headless browser
 */
async function fetchClubSpotEntrants(regattaId) {
  const regattaUrl = `https://theclubspot.com/regatta/${regattaId}`;
  let browser = null;

  try {
    logger.info(`[ClubSpot] Fetching with Puppeteer: ${regattaUrl}`);

    // Launch Puppeteer with Cloud Functions-compatible settings
    // Use @sparticuz/chromium for serverless environments
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to the regatta page with entry-list hash
    const entryListUrl = `${regattaUrl}/#entry-list`;
    logger.info(`[ClubSpot] Navigating to: ${entryListUrl}`);

    await page.goto(entryListUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for the entry list table to render
    logger.info('[ClubSpot] Waiting for entry list table to render...');

    // Try multiple selectors that ClubSpot might use
    const tableSelectors = [
      'table.table',
      '.entry-list table',
      '#entry-list table',
      '[data-tab="entry-list"] table',
      '.registrations table',
      'table tbody tr'
    ];

    let tableFound = false;
    for (const selector of tableSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        tableFound = true;
        logger.info(`[ClubSpot] Found table with selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!tableFound) {
      // Wait a bit more and try a general wait
      logger.info('[ClubSpot] No specific table found, waiting for page to fully load...');
      await page.waitForTimeout(5000);
    }

    // Click on Entry List tab if it exists
    try {
      const entryListTab = await page.$('a[href="#entry-list"], [data-target="entry-list"], .nav-link:contains("Entry")');
      if (entryListTab) {
        await entryListTab.click();
        await page.waitForTimeout(2000);
        logger.info('[ClubSpot] Clicked entry list tab');
      }
    } catch (e) {
      // Tab might already be active
    }

    // Get the rendered HTML
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract event metadata
    const eventName = extractEventNameFromPage($);
    const eventDates = extractEventDatesFromPage($);

    // Scrape the entry list from the rendered page
    logger.info('[ClubSpot] Scraping entry list from rendered page...');
    const registrations = scrapeRenderedEntryList($, regattaId);

    // Transform to Competitor format
    const competitors = transformToCompetitors(registrations, regattaId);

    logger.info(`[ClubSpot] Successfully extracted ${competitors.length} entrants for ${regattaId}`);

    return {
      success: true,
      regattaId,
      eventName,
      eventDates,
      entrants: competitors,
      totalEntrants: competitors.length,
      source: 'clubspot',
      _fetchedAt: Date.now(),
      _metadata: {
        scrapedAt: new Date().toISOString(),
        source: regattaUrl,
        method: 'puppeteer'
      }
    };

  } catch (error) {
    logger.error(`[ClubSpot] Failed to fetch regatta ${regattaId}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Check if a string looks like a valid sail number
 * Valid sail numbers: "AUS 219", "GBR 123", "HKG45", "DEN 89", etc.
 */
function looksLikeSailNumber(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  // Match patterns like "AUS 219", "GBR123", "HKG 45", "DEN89"
  // Also match just numbers like "219", "45"
  return /^[A-Z]{2,3}\s*\d+$/i.test(trimmed) || /^\d+$/.test(trimmed);
}

/**
 * Check if a string looks like a person's name
 * Names typically have letters, spaces, and common name patterns
 */
function looksLikeName(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  // Names: mostly letters, possibly with spaces, hyphens, apostrophes
  // Should not start with numbers or be all caps abbreviations
  if (trimmed.length < 2) return false;
  if (/^\d/.test(trimmed)) return false; // Starts with number
  if (/^[A-Z]{2,4}$/.test(trimmed)) return false; // Short all-caps (like country codes)
  // Contains at least one letter and has reasonable name characters
  return /^[A-Za-zÀ-ÿ\s\-'\.]+$/.test(trimmed) && /[a-z]/i.test(trimmed);
}

/**
 * Scrape entry list from rendered HTML
 * Based on ClubSpot's table structure: SAILORS, CLASS, SAIL NUMBER, BOAT NAME, CLUB / ORG
 */
function scrapeRenderedEntryList($, regattaId) {
  const registrations = [];

  // Find all tables and look for entry list data
  $('table').each((tableIndex, table) => {
    const $table = $(table);
    const headers = [];

    // Extract headers to understand column structure
    $table.find('thead th, tr:first-child th').each((i, th) => {
      headers.push($(th).text().trim().toLowerCase());
    });

    logger.info(`[ClubSpot] Table ${tableIndex} raw headers: ${JSON.stringify(headers)}`);

    // Map header positions with precise matching to avoid false positives
    // Key insight: "name" matches both "sailors name" and "boat name", so we need to be specific
    const colMap = {
      // "sailor" matches "SAILORS" but exclude "boat name" by checking for "boat"
      sailors: headers.findIndex(h =>
        h.includes('sailor') ||
        h.includes('crew') ||
        (h.includes('name') && !h.includes('boat'))  // Exclude "boat name"
      ),
      class: headers.findIndex(h => h.includes('class')),
      // "sail number" specifically, or "sail #" / "sail no"
      sailNumber: headers.findIndex(h =>
        (h.includes('sail') && (h.includes('number') || h.includes('#') || h.includes('no'))) ||
        h === 'sail' ||  // exact match for just "sail"
        (h.includes('number') && !h.includes('phone'))  // "number" alone but not phone number
      ),
      // "boat name" specifically - must have BOTH "boat" AND "name"
      boatName: headers.findIndex(h => h.includes('boat') && h.includes('name')),
      club: headers.findIndex(h => h.includes('club') || h.includes('org'))
    };

    logger.info(`[ClubSpot] Initial column mapping: ${JSON.stringify(colMap)}`);

    // Validate mapping - use default ClubSpot layout if detection is uncertain
    // ClubSpot standard layout: SAILORS, CLASS, SAIL NUMBER, BOAT NAME, CLUB / ORG
    const hasValidMapping = colMap.sailors >= 0 && colMap.sailNumber >= 0;
    if (!hasValidMapping) {
      logger.info('[ClubSpot] Column detection uncertain, using default ClubSpot column layout');
      colMap.sailors = 0;
      colMap.class = 1;
      colMap.sailNumber = 2;
      colMap.boatName = 3;
      colMap.club = 4;
    }

    logger.info(`[ClubSpot] Final column mapping: ${JSON.stringify(colMap)}`);

    // Track if we're logging sample row for debugging
    let loggedSampleRow = false;

    // Extract rows
    $table.find('tbody tr').each((rowIndex, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 3) return; // Skip rows with too few cells

      // Extract all cell values for intelligent parsing
      const cellValues = [];
      cells.each((i, cell) => {
        cellValues.push($(cell).text().trim());
      });

      // Log sample row data for debugging (first row only)
      if (!loggedSampleRow) {
        logger.info(`[ClubSpot] Sample row data (${cellValues.length} cells): ${JSON.stringify(cellValues)}`);
        loggedSampleRow = true;
      }

      // Extract data based on column mapping
      let sailorsCell = colMap.sailors >= 0 ? cellValues[colMap.sailors] || '' : '';
      let classCell = colMap.class >= 0 ? cellValues[colMap.class] || '' : '';
      let sailNumberCell = colMap.sailNumber >= 0 ? cellValues[colMap.sailNumber] || '' : '';
      let boatNameCell = colMap.boatName >= 0 ? cellValues[colMap.boatName] || '' : '';
      let clubCell = colMap.club >= 0 ? cellValues[colMap.club] || '' : '';

      // VALIDATION: Check if sailNumber actually looks like a sail number
      // If not, try to intelligently re-map the data
      if (!looksLikeSailNumber(sailNumberCell) && looksLikeName(sailNumberCell)) {
        logger.info(`[ClubSpot] Detected misaligned columns - sailNumber "${sailNumberCell}" looks like a name`);

        // Try to find the actual sail number in other cells
        let foundSailNumber = '';
        let sailNumberIdx = -1;

        for (let i = 0; i < cellValues.length; i++) {
          if (looksLikeSailNumber(cellValues[i])) {
            foundSailNumber = cellValues[i];
            sailNumberIdx = i;
            break;
          }
        }

        // Re-map based on what we found
        // Common ClubSpot layout seems to be:
        // Col 0: Index/Date, Col 1: Sailors, Col 2: Class, Col 3: Sail#, Col 4: Boat Name, Col 5: Club
        if (cellValues.length >= 6) {
          // Assume extended layout
          sailorsCell = cellValues[1] || '';
          classCell = cellValues[2] || '';
          sailNumberCell = foundSailNumber || cellValues[3] || '';
          boatNameCell = cellValues[4] || '';
          clubCell = cellValues[5] || '';
        } else if (foundSailNumber) {
          // Use found sail number, treat current sailNumberCell as sailors
          sailorsCell = sailNumberCell;
          sailNumberCell = foundSailNumber;
        }
      }

      // Parse sailors - typically "Name1, Name2, Name3" or multiline or concatenated
      let sailorNames = [];
      if (sailorsCell) {
        // First check if comma or newline separated (most common)
        if (sailorsCell.includes(',') || sailorsCell.includes('\n')) {
          sailorNames = sailorsCell
            .split(/[,\n]/)
            .map(n => n.trim())
            .filter(n => n && n.length > 1);
        }
        // Check for concatenated names without separators
        // e.g., "Sandy AndersonSusan ParkerCaroline Gibson"
        // Split at uppercase letters that follow lowercase letters (start of new name)
        else if (!sailorsCell.includes(' ') || /[a-z][A-Z]/.test(sailorsCell)) {
          // Split where a lowercase letter is followed by uppercase (new first name)
          const parts = sailorsCell.split(/(?<=[a-z])(?=[A-Z])/);
          // Now each part should be a full name like "Sandy Anderson" or "Glenn Cooke"
          sailorNames = parts
            .map(n => n.trim())
            .filter(n => n && n.length > 1 && /\s/.test(n)); // Must have space (first + last)
        }
        // Otherwise treat as space-separated list where each full name might be "First Last" pattern
        // Handle names with particles like "van", "von", "de", etc.
        else {
          // Split by multiple spaces or try to identify name boundaries
          const words = sailorsCell.split(/\s+/);
          const names = [];
          let currentName = [];

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const nextWord = words[i + 1];

            currentName.push(word);

            // Check if this completes a name:
            // - Next word starts with capital (new first name) AND current doesn't end with particle
            // - We have at least 2 words and next isn't a particle (van, von, de, etc.)
            const particles = ['van', 'von', 'de', 'du', 'le', 'la', 'der', 'den', 'het'];
            const isParticle = particles.includes(word.toLowerCase());
            const nextIsParticle = nextWord && particles.includes(nextWord.toLowerCase());
            const nextStartsCapital = nextWord && /^[A-Z]/.test(nextWord);

            // End name if: we have 2+ words, next starts capital, and current isn't a particle
            if (currentName.length >= 2 && !isParticle && nextStartsCapital && !nextIsParticle) {
              names.push(currentName.join(' '));
              currentName = [];
            }
          }

          // Don't forget the last name
          if (currentName.length > 0) {
            names.push(currentName.join(' '));
          }

          sailorNames = names.filter(n => n && n.trim().length > 1);
        }

        // Fallback: if we got nothing, just use the whole cell as one name
        if (sailorNames.length === 0 && sailorsCell.trim().length > 0) {
          sailorNames = [sailorsCell.trim()];
        }
      }

      // Skip if no meaningful data
      if (sailorNames.length === 0 && !sailNumberCell && !boatNameCell) return;

      // Final validation - if sailNumber still looks like names, mark as TBD
      const finalSailNumber = looksLikeSailNumber(sailNumberCell) ? sailNumberCell : 'TBD';

      const registration = {
        id: `clubspot_${regattaId}_${registrations.length + 1}`,
        helmName: sailorNames[0] || '',
        crewNames: sailorNames.slice(1),
        boatClass: classCell || 'Dragon',
        sailNumber: finalSailNumber,
        boatName: boatNameCell,
        club: clubCell,
        country: extractCountryFromSailNumber(finalSailNumber),
        status: 'confirmed'
      };

      logger.info(`[ClubSpot] Found entry: ${registration.sailNumber} - ${registration.helmName} (${registration.boatName})`);
      registrations.push(registration);
    });
  });

  // If no table entries found, try alternative selectors
  if (registrations.length === 0) {
    logger.info('[ClubSpot] No table entries found, trying alternative selectors...');

    // Try card-based layouts
    $('.entry-card, .registration-item, .competitor-row').each((i, el) => {
      const $el = $(el);
      const registration = {
        id: `clubspot_${regattaId}_${i + 1}`,
        helmName: $el.find('.name, .sailor-name, .helm').text().trim(),
        crewNames: [],
        sailNumber: $el.find('.sail-number, .boat-number').text().trim(),
        boatName: $el.find('.boat-name').text().trim(),
        club: $el.find('.club, .yacht-club').text().trim(),
        boatClass: $el.find('.class, .boat-class').text().trim() || 'Dragon',
        country: '',
        status: 'confirmed'
      };

      if (registration.helmName || registration.sailNumber) {
        registration.country = extractCountryFromSailNumber(registration.sailNumber);
        registrations.push(registration);
      }
    });
  }

  return registrations;
}

/**
 * Extract country code from sail number (e.g., "AUS 219" -> "AUS")
 */
function extractCountryFromSailNumber(sailNumber) {
  if (!sailNumber) return '';

  const match = sailNumber.match(/^([A-Z]{2,3})\s*\d/);
  if (match) {
    return normalizeCountryCode(match[1]);
  }
  return '';
}

/**
 * Extract event name from rendered page
 */
function extractEventNameFromPage($) {
  // Try various selectors for event name
  const selectors = [
    'h1.regatta-name',
    '.regatta-header h1',
    '.event-title',
    'h1',
    '.page-title'
  ];

  for (const selector of selectors) {
    const text = $(selector).first().text().trim();
    if (text && text.length > 0 && text.length < 200) {
      return text;
    }
  }

  return 'Dragon Championship';
}

/**
 * Extract event dates from rendered page
 */
function extractEventDatesFromPage($) {
  // Look for date elements
  const dateText = $('.event-dates, .regatta-dates, .dates').first().text().trim();
  if (dateText) {
    return { raw: dateText };
  }
  return null;
}


/**
 * Transform ClubSpot/Parse registrations to Competitor format
 */
function transformToCompetitors(registrations, regattaId) {
  return registrations.map((reg, index) => {
    // Handle different data structures from Parse API vs HTML scraping
    const participants = reg.participantsArray || reg.participants || [];
    const boatClass = reg.boatClassObject?.name || reg.boatClass || 'Dragon';
    const club = reg.club?.name || reg.club || '';

    // Extract helm and crew - PRIORITY ORDER MATTERS!
    // Priority 1: Direct helmName from scraping (most reliable for ClubSpot HTML scraping)
    // Priority 2: Parse API participants array (for API-based fetching)
    // Priority 3: Alternative field names (skipperName, owner, etc.)
    // Priority 4: ONLY use "Entry X" if we truly have no data
    let helmName = '';
    let crewNames = [];

    // Priority 1: Direct helmName from scraping
    if (reg.helmName && reg.helmName.trim()) {
      helmName = reg.helmName.trim();
      crewNames = reg.crewNames || [];
    }
    // Priority 2: Parse API participants array
    else if (Array.isArray(participants) && participants.length > 0) {
      helmName = formatParticipantName(participants[0]);
      crewNames = participants.slice(1).map(formatParticipantName).filter(n => n);
    }
    // Priority 3: Alternative field names
    else if (reg.skipperName || reg.owner || reg.contactName) {
      helmName = (reg.skipperName || reg.owner || reg.contactName || '').trim();
    }
    // Priority 4: ONLY use "Entry X" if we truly have no data
    else {
      helmName = `Entry ${index + 1}`;
      logger.info(`[ClubSpot] Warning: No helmName found for entry ${index + 1}, using fallback`);
    }

    // Determine registration status
    let registrationStatus = 'pending';
    const status = (reg.status || '').toLowerCase();

    if (status.includes('confirmed') || status.includes('approved') || reg.confirmedAt) {
      registrationStatus = 'confirmed';
    } else if (status.includes('paid') || reg.paidAt) {
      registrationStatus = 'paid';
    } else if (status.includes('incomplete')) {
      registrationStatus = 'incomplete';
    }

    // Determine payment status
    let paymentStatus = 'pending';
    if (reg.paidAt || reg.paymentStatus === 'paid' || reg.paymentComplete) {
      paymentStatus = 'paid';
    } else if (reg.paymentStatus === 'overdue' || reg.paymentOverdue) {
      paymentStatus = 'overdue';
    }

    // Extract country code
    let country = reg.country || reg.nationality || '';
    if (reg.club?.country) {
      country = reg.club.country;
    }
    // Normalize country codes
    country = normalizeCountryCode(country);

    return {
      id: reg.objectId || reg.id || `clubspot_${regattaId}_${index + 1}`,
      sailNumber: reg.sailNumber || reg.boatNumber || `${country || 'TBD'} ${String(index + 1).padStart(3, '0')}`,
      helmName: helmName,
      crewNames: crewNames,
      country: country || 'TBD',
      club: club,
      className: boatClass,
      registrationStatus: registrationStatus,
      entryDate: reg.confirmedAt || reg.createdAt || new Date().toISOString(),
      paymentStatus: paymentStatus,
      documentsSubmitted: reg.documentsComplete || reg.documentsSubmitted || false,
      measurementCompleted: reg.measurementComplete || reg.measurementCompleted || false,
      boatName: reg.boatName || '',
      // Additional ClubSpot-specific fields
      _source: 'clubspot',
      _regattaId: regattaId
    };
  });
}

/**
 * Format participant name from various data structures
 */
function formatParticipantName(participant) {
  if (!participant) return '';

  if (typeof participant === 'string') {
    return participant.trim();
  }

  if (participant.firstName || participant.lastName) {
    return `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
  }

  if (participant.name) {
    return participant.name.trim();
  }

  if (participant.fullName) {
    return participant.fullName.trim();
  }

  return '';
}

/**
 * Normalize country codes to 3-letter format
 */
function normalizeCountryCode(code) {
  if (!code) return '';

  const normalized = code.toUpperCase().trim();

  // Common mappings
  const countryMap = {
    'HONG KONG': 'HKG',
    'HK': 'HKG',
    'AUSTRALIA': 'AUS',
    'AU': 'AUS',
    'UNITED KINGDOM': 'GBR',
    'UK': 'GBR',
    'GB': 'GBR',
    'UNITED STATES': 'USA',
    'US': 'USA',
    'NEW ZEALAND': 'NZL',
    'NZ': 'NZL',
    'SINGAPORE': 'SIN',
    'SG': 'SIN',
    'JAPAN': 'JPN',
    'JP': 'JPN',
    'GERMANY': 'GER',
    'DE': 'GER',
    'FRANCE': 'FRA',
    'FR': 'FRA',
    'ITALY': 'ITA',
    'IT': 'ITA',
    'NETHERLANDS': 'NED',
    'NL': 'NED',
    'SPAIN': 'ESP',
    'ES': 'ESP',
    'CANADA': 'CAN',
    'CA': 'CAN',
    'DENMARK': 'DEN',
    'DK': 'DEN',
    'SWEDEN': 'SWE',
    'SE': 'SWE',
    'CHINA': 'CHN',
    'CN': 'CHN'
  };

  return countryMap[normalized] || normalized.substring(0, 3);
}

/**
 * Get cached entrants from Firestore
 */
async function getCachedEntrants(regattaId) {
  try {
    const cacheDoc = await db.collection('clubSpotCache').doc(regattaId).get();

    if (!cacheDoc.exists) {
      return null;
    }

    const data = cacheDoc.data();
    const cacheAge = Date.now() - data._fetchedAt;

    if (cacheAge > CACHE_DURATION) {
      logger.info(`[ClubSpot] Cache expired for ${regattaId} (age: ${cacheAge}ms)`);
      return null;
    }

    return data;
  } catch (error) {
    logger.warn('[ClubSpot] Cache read error:', error);
    return null;
  }
}

/**
 * Cache entrants to Firestore
 */
async function cacheEntrants(regattaId, data) {
  try {
    await db.collection('clubSpotCache').doc(regattaId).set({
      ...data,
      _cachedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.info(`[ClubSpot] Cached ${data.totalEntrants} entrants for ${regattaId}`);
  } catch (error) {
    logger.warn('[ClubSpot] Cache write error:', error);
  }
}

module.exports = {
  scrapeClubSpotEntrants: exports.scrapeClubSpotEntrants
};
