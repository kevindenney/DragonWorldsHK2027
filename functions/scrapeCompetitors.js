/**
 * Competitor and entry list scraping module
 * Extracts participant data from race event pages
 */

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { logger } = require('firebase-functions');

/**
 * Scrape competitor/entry list from event page
 */
async function scrapeCompetitorList(eventId, eventUrl = null) {
  const url = eventUrl || `https://www.racingrulesofsailing.org/event/${eventId}/entries`;
  
  try {
    logger.info(`Scraping competitor list from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      // Try alternate URL patterns
      const alternateUrls = [
        `https://www.racingrulesofsailing.org/event/${eventId}/competitors`,
        `https://www.racingrulesofsailing.org/event/${eventId}/entry-list`,
        `https://www.racingrulesofsailing.org/event/${eventId}`
      ];
      
      for (const altUrl of alternateUrls) {
        const altResponse = await fetch(altUrl, { headers: response.headers });
        if (altResponse.ok) {
          const html = await altResponse.text();
          return parseCompetitorList(cheerio.load(html), eventId);
        }
      }
      
      throw new Error(`Failed to fetch competitor list: ${response.status}`);
    }

    const html = await response.text();
    return parseCompetitorList(cheerio.load(html), eventId);
    
  } catch (error) {
    logger.error('Competitor list scraping failed:', error);
    throw error;
  }
}

/**
 * Parse competitor list from HTML
 */
function parseCompetitorList($, eventId) {
  const competitors = [];
  const metadata = {
    eventId,
    totalEntries: 0,
    divisions: [],
    countries: new Set(),
    clubs: new Set(),
    scrapedAt: new Date().toISOString()
  };
  
  // Try multiple selectors for entry lists
  const entrySelectors = [
    '.entry-list table tr',
    '.competitor-list table tr',
    '.entries table tr',
    'table.entries tr',
    '#entry-list tr',
    'table tr:has(td:contains("HKG"))', // Look for sail numbers
    'table tr:has(td:contains("GBR"))',
    'table tr:has(td:contains("AUS"))'
  ];
  
  let foundEntries = false;
  
  for (const selector of entrySelectors) {
    const rows = $(selector);
    if (rows.length > 0) {
      rows.each((index, row) => {
        const competitor = parseCompetitorRow($, row);
        if (competitor && competitor.sailNumber) {
          competitors.push(competitor);
          
          // Update metadata
          if (competitor.country) {
            metadata.countries.add(competitor.country);
          }
          if (competitor.club) {
            metadata.clubs.add(competitor.club);
          }
          
          foundEntries = true;
        }
      });
      
      if (foundEntries) break;
    }
  }
  
  // If no table found, try to extract from lists or divs
  if (!foundEntries) {
    const listSelectors = [
      '.entry-list li',
      '.competitor-list li',
      '.entries .competitor',
      '.entry-item'
    ];
    
    for (const selector of listSelectors) {
      $(selector).each((index, element) => {
        const competitor = parseCompetitorElement($, element);
        if (competitor && competitor.sailNumber) {
          competitors.push(competitor);
          
          if (competitor.country) {
            metadata.countries.add(competitor.country);
          }
          if (competitor.club) {
            metadata.clubs.add(competitor.club);
          }
        }
      });
    }
  }
  
  // Extract division information
  metadata.divisions = extractDivisions($, competitors);
  metadata.totalEntries = competitors.length;
  metadata.countries = Array.from(metadata.countries);
  metadata.clubs = Array.from(metadata.clubs);
  
  return {
    competitors,
    metadata
  };
}

/**
 * Parse a competitor from a table row
 */
function parseCompetitorRow($, row) {
  const $row = $(row);
  const cells = $row.find('td');
  
  if (cells.length < 2) return null;
  
  const competitor = {
    id: null,
    sailNumber: null,
    boatName: null,
    helmName: null,
    crewMembers: [],
    club: null,
    country: null,
    division: null,
    registrationStatus: 'confirmed',
    entryDate: null,
    paymentStatus: 'paid',
    documentsSubmitted: true,
    measurementCompleted: true,
    contactEmail: null,
    contactPhone: null,
    emergencyContact: null,
    boatDetails: {}
  };
  
  // Common column patterns
  // Pattern 1: Sail#, Helm, Crew, Club/Country
  // Pattern 2: Position, Sail#, Boat Name, Helm, Club
  // Pattern 3: Sail#, Helm/Crew, Country, Club
  
  let colIndex = 0;
  
  // Skip position column if present
  if (cells.eq(0).text().match(/^\d+$/)) {
    colIndex = 1;
  }
  
  // Sail number (required)
  const sailText = cells.eq(colIndex).text().trim();
  const sailNumber = extractSailNumber(sailText);
  if (!sailNumber) return null;
  
  competitor.sailNumber = sailNumber;
  competitor.country = extractCountryCode(sailNumber);
  colIndex++;
  
  // Check if next column is boat name (usually italicized or in quotes)
  const col2Text = cells.eq(colIndex).text().trim();
  if (col2Text && (col2Text.startsWith('"') || cells.eq(colIndex).find('i, em').length > 0)) {
    competitor.boatName = col2Text.replace(/['"]/g, '');
    colIndex++;
  }
  
  // Helm name
  if (cells.eq(colIndex).length > 0) {
    competitor.helmName = cleanName(cells.eq(colIndex).text());
    colIndex++;
  }
  
  // Crew names (might be multiple columns or comma-separated)
  while (colIndex < cells.length) {
    const cellText = cells.eq(colIndex).text().trim();
    
    // Check if this looks like a name
    if (cellText && isLikelyName(cellText)) {
      // Check if comma-separated crew list
      if (cellText.includes(',')) {
        const crewNames = cellText.split(',').map(n => cleanName(n));
        competitor.crewMembers.push(...crewNames);
      } else {
        competitor.crewMembers.push(cleanName(cellText));
      }
      colIndex++;
    } else if (cellText && (cellText.length <= 6 || cellText.includes('(')) && !competitor.club) {
      // Likely club/country
      if (cellText.includes('(')) {
        const parts = cellText.split('(');
        competitor.club = parts[0].trim();
        competitor.country = parts[1].replace(')', '').trim();
      } else if (cellText.match(/^[A-Z]{3}$/)) {
        competitor.country = cellText;
      } else {
        competitor.club = cellText;
      }
      colIndex++;
    } else {
      colIndex++;
    }
  }
  
  // Generate ID
  competitor.id = `comp_${competitor.sailNumber.replace(/\s/g, '_')}`;
  
  // Extract additional details from row attributes or classes
  const rowClasses = $row.attr('class') || '';
  if (rowClasses.includes('pending')) {
    competitor.registrationStatus = 'pending';
  }
  if (rowClasses.includes('withdrawn')) {
    competitor.registrationStatus = 'withdrawn';
  }
  
  // Check for division/fleet indicators
  const rowText = $row.text();
  const divisionMatch = rowText.match(/\b(Red|Blue|Yellow|Green|White)\s*(?:Fleet|Division)/i);
  if (divisionMatch) {
    competitor.division = divisionMatch[1];
  }
  
  return competitor;
}

/**
 * Parse competitor from a list element
 */
function parseCompetitorElement($, element) {
  const $el = $(element);
  const text = $el.text();
  
  const competitor = {
    id: null,
    sailNumber: null,
    boatName: null,
    helmName: null,
    crewMembers: [],
    club: null,
    country: null,
    division: null,
    registrationStatus: 'confirmed'
  };
  
  // Extract sail number
  const sailNumber = extractSailNumber(text);
  if (!sailNumber) return null;
  
  competitor.sailNumber = sailNumber;
  competitor.country = extractCountryCode(sailNumber);
  
  // Try to parse structured data
  const nameMatch = text.match(/(?:Helm:|Skipper:)?\s*([A-Za-z\s]+?)(?:\s*(?:&|and|with|Crew:))/i);
  if (nameMatch) {
    competitor.helmName = cleanName(nameMatch[1]);
  }
  
  // Extract boat name if in quotes or italics
  const boatMatch = text.match(/["']([^"']+)["']/);
  if (boatMatch) {
    competitor.boatName = boatMatch[1];
  }
  
  // Extract club
  const clubMatch = text.match(/(?:from|representing)\s+([^,\n]+)/i);
  if (clubMatch) {
    competitor.club = clubMatch[1].trim();
  }
  
  competitor.id = `comp_${competitor.sailNumber.replace(/\s/g, '_')}`;
  
  return competitor;
}

/**
 * Extract divisions from competitors or page content
 */
function extractDivisions($, competitors) {
  const divisions = {};
  
  // Check for explicit division sections
  $('.division, .fleet, [class*="division"], [class*="fleet"]').each((index, element) => {
    const $el = $(element);
    const divisionName = $el.find('h2, h3, .title').first().text().trim();
    
    if (divisionName) {
      const cleanName = divisionName.replace(/Division|Fleet|Results|Entries/gi, '').trim();
      divisions[cleanName] = {
        name: cleanName,
        count: 0,
        sailNumbers: []
      };
    }
  });
  
  // Assign competitors to divisions based on their division field
  competitors.forEach(comp => {
    if (comp.division) {
      if (!divisions[comp.division]) {
        divisions[comp.division] = {
          name: comp.division,
          count: 0,
          sailNumbers: []
        };
      }
      divisions[comp.division].count++;
      divisions[comp.division].sailNumbers.push(comp.sailNumber);
    }
  });
  
  // If no divisions found, check for common fleet colors in text
  if (Object.keys(divisions).length === 0) {
    const fleetColors = ['Red', 'Blue', 'Yellow', 'Green', 'White'];
    const pageText = $('body').text();
    
    fleetColors.forEach(color => {
      const regex = new RegExp(color + '\\s*(?:Fleet|Division)', 'gi');
      if (pageText.match(regex)) {
        divisions[color] = {
          name: color,
          count: 0,
          sailNumbers: []
        };
      }
    });
  }
  
  return Object.values(divisions);
}

/**
 * Extract sail number from text
 */
function extractSailNumber(text) {
  // Common patterns: "GBR 123", "HKG123", "AUS 1234"
  const patterns = [
    /\b([A-Z]{2,3})\s*(\d{1,4})\b/,
    /\b([A-Z]{2,3})(\d{1,4})\b/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]} ${match[2]}`.trim();
    }
  }
  
  return null;
}

/**
 * Extract country code from sail number
 */
function extractCountryCode(sailNumber) {
  const match = sailNumber.match(/^([A-Z]{2,3})/);
  return match ? match[1] : null;
}

/**
 * Clean name text
 */
function cleanName(text) {
  return text
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .replace(/^[,\s]+|[,\s]+$/g, '') // Trim commas and spaces
    .trim();
}

/**
 * Check if text is likely a person's name
 */
function isLikelyName(text) {
  // Simple heuristic: contains letters, reasonable length, not all caps
  if (!text || text.length < 2 || text.length > 50) return false;
  if (!/[a-zA-Z]/.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^[A-Z]{2,4}$/.test(text)) return false; // Likely country code
  
  return true;
}

/**
 * Scrape additional competitor details
 */
async function scrapeCompetitorDetails(eventId, sailNumber) {
  const url = `https://www.racingrulesofsailing.org/event/${eventId}/competitor/${sailNumber}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    return {
      boatDetails: extractBoatDetails($),
      registrationDetails: extractRegistrationDetails($),
      performanceHistory: extractPerformanceHistory($)
    };
    
  } catch (error) {
    logger.warn(`Failed to fetch details for ${sailNumber}:`, error.message);
    return null;
  }
}

/**
 * Extract boat details from competitor page
 */
function extractBoatDetails($) {
  const details = {};
  
  // Look for boat specifications
  $('.boat-details, .specifications, [class*="boat"]').each((index, element) => {
    const $el = $(element);
    const text = $el.text();
    
    // Hull number
    const hullMatch = text.match(/Hull[:\s#]*(\d+)/i);
    if (hullMatch) {
      details.hullNumber = hullMatch[1];
    }
    
    // Builder
    const builderMatch = text.match(/Builder[:\s]*([^\n,]+)/i);
    if (builderMatch) {
      details.builder = builderMatch[1].trim();
    }
    
    // Year
    const yearMatch = text.match(/Year[:\s]*(\d{4})/i);
    if (yearMatch) {
      details.year = parseInt(yearMatch[1]);
    }
    
    // Sail maker
    const sailMatch = text.match(/Sails?[:\s]*([^\n,]+)/i);
    if (sailMatch) {
      details.sailMaker = sailMatch[1].trim();
    }
  });
  
  return details;
}

/**
 * Extract registration details
 */
function extractRegistrationDetails($) {
  const details = {};
  
  $('.registration, .entry-details').each((index, element) => {
    const text = $(element).text();
    
    // Entry date
    const dateMatch = text.match(/Entry Date[:\s]*([^\n]+)/i);
    if (dateMatch) {
      details.entryDate = dateMatch[1].trim();
    }
    
    // Payment status
    if (text.match(/paid|confirmed|complete/i)) {
      details.paymentStatus = 'paid';
    } else if (text.match(/pending|awaiting/i)) {
      details.paymentStatus = 'pending';
    }
    
    // Documents
    if (text.match(/documents?\s*(?:submitted|received|complete)/i)) {
      details.documentsComplete = true;
    }
    
    // Measurement
    if (text.match(/measurement\s*(?:complete|passed|valid)/i)) {
      details.measurementComplete = true;
    }
  });
  
  return details;
}

/**
 * Extract performance history
 */
function extractPerformanceHistory($) {
  const history = [];
  
  $('.history, .past-results, .performance').find('tr, li').each((index, element) => {
    const text = $(element).text();
    
    // Look for event name and position
    const resultMatch = text.match(/(.+?)\s*[-–]\s*(\d+)(?:st|nd|rd|th)?\s*(?:place|position)?/i);
    if (resultMatch) {
      history.push({
        event: resultMatch[1].trim(),
        position: parseInt(resultMatch[2])
      });
    }
  });
  
  return history;
}

module.exports = {
  scrapeCompetitorList,
  scrapeCompetitorDetails,
  parseCompetitorList,
  parseCompetitorRow,
  extractSailNumber
};