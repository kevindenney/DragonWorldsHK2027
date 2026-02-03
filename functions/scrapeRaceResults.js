/**
 * Enhanced race results scraping module for racingrulesofsailing.org
 * Handles Dragon Worlds HK 2027 and APAC 2026 events
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
    documentsUrl: 'https://www.racingrulesofsailing.org/documents/13241/event',
    schedulesUrl: 'https://www.racingrulesofsailing.org/schedules/13241/event',
    decisionsUrl: 'https://www.racingrulesofsailing.org/decisions/13241/event',
  },
  '13242': {
    name: 'Hong Kong Dragon World Championship 2027',
    shortName: 'Worlds 2027',
    documentsUrl: 'https://www.racingrulesofsailing.org/documents/13242/event',
    schedulesUrl: 'https://www.racingrulesofsailing.org/schedules/13242/event',
    decisionsUrl: 'https://www.racingrulesofsailing.org/decisions/13242/event',
  },
};

/**
 * Scrape comprehensive race results from event page
 */
async function scrapeRaceResults(eventId, eventUrl = null) {
  // Use event-specific URL pattern for racingrulesofsailing.org
  const config = EVENT_CONFIG[eventId];
  const url = eventUrl || (config
    ? config.documentsUrl
    : `https://www.racingrulesofsailing.org/documents/${eventId}/event`);
  
  try {
    logger.info(`Scraping race results from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
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
    
    const results = {
      eventId,
      eventName: extractEventName($),
      lastUpdated: new Date().toISOString(),
      races: extractIndividualRaces($),
      overallStandings: extractOverallStandings($),
      divisions: extractDivisions($),
      metadata: extractMetadata($)
    };
    
    logger.info(`Extracted results for ${results.races.length} races and ${results.overallStandings.length} competitors`);
    return results;
    
  } catch (error) {
    logger.error('Race results scraping failed:', error);
    throw error;
  }
}

/**
 * Extract event name from page
 */
function extractEventName($) {
  const selectors = [
    'h1.event-title',
    'h1.page-title', 
    '.event-header h1',
    'title'
  ];
  
  for (const selector of selectors) {
    const text = $(selector).first().text().trim();
    if (text) {
      return text.replace(/Results?|Standings?|-/gi, '').trim();
    }
  }
  
  return 'Unknown Event';
}

/**
 * Extract individual race results
 */
function extractIndividualRaces($) {
  const races = [];
  
  // Look for race result tables
  const raceTableSelectors = [
    '.race-results table',
    'table.results',
    '.results-table',
    'table[id*="race"]'
  ];
  
  raceTableSelectors.forEach(selector => {
    $(selector).each((index, table) => {
      const raceData = parseRaceTable($, table);
      if (raceData && raceData.results.length > 0) {
        races.push(raceData);
      }
    });
  });
  
  // If no tables found, try to extract from lists or divs
  if (races.length === 0) {
    races.push(...extractRacesFromLists($));
  }
  
  return races;
}

/**
 * Parse a single race results table
 */
function parseRaceTable($, table) {
  const $table = $(table);
  const results = [];
  
  // Extract race number from table header or caption
  let raceNumber = null;
  const captionText = $table.find('caption').text();
  const headerText = $table.prev('h2, h3, h4').text();
  
  const raceNumMatch = (captionText + ' ' + headerText).match(/Race\s*(\d+)/i);
  if (raceNumMatch) {
    raceNumber = parseInt(raceNumMatch[1]);
  }
  
  // Parse table rows
  $table.find('tbody tr, tr').each((index, row) => {
    const $row = $(row);
    const cells = $row.find('td');
    
    if (cells.length >= 3) {
      const result = {
        position: extractNumber(cells.eq(0).text()),
        sailNumber: cells.eq(1).text().trim(),
        helmName: cells.eq(2).text().trim(),
        points: extractNumber(cells.eq(-1).text()),
        finishTime: null,
        status: 'finished'
      };
      
      // Check for DNF, DNS, DSQ, OCS, etc.
      const statusMatch = $row.text().match(/\b(DNF|DNS|DSQ|OCS|BFD|RET|DNC)\b/i);
      if (statusMatch) {
        result.status = statusMatch[1].toUpperCase();
      }
      
      // Look for crew name
      if (cells.length > 3) {
        result.crewName = cells.eq(3).text().trim();
      }
      
      // Look for club/country
      if (cells.length > 4) {
        result.club = cells.eq(4).text().trim();
      }
      
      if (result.sailNumber) {
        results.push(result);
      }
    }
  });
  
  return {
    raceNumber: raceNumber || index + 1,
    raceDate: extractRaceDate($table),
    results: results,
    conditions: extractRaceConditions($, $table)
  };
}

/**
 * Extract races from list format (non-table)
 */
function extractRacesFromLists($) {
  const races = [];
  
  $('.race-result, .race-list, [class*="race-"]').each((index, element) => {
    const $el = $(element);
    const raceText = $el.text();
    
    // Parse race number
    const raceNumMatch = raceText.match(/Race\s*(\d+)/i);
    if (raceNumMatch) {
      const raceNumber = parseInt(raceNumMatch[1]);
      const results = [];
      
      // Extract results from text
      const lines = raceText.split('\n');
      lines.forEach(line => {
        const resultMatch = line.match(/(\d+)\s+([A-Z]{3}\s*\d+)\s+([\w\s]+?)(?:\s+(\d+(?:\.\d+)?))?\s*$/);
        if (resultMatch) {
          results.push({
            position: parseInt(resultMatch[1]),
            sailNumber: resultMatch[2].trim(),
            helmName: resultMatch[3].trim(),
            points: parseFloat(resultMatch[4]) || null,
            status: 'finished'
          });
        }
      });
      
      if (results.length > 0) {
        races.push({
          raceNumber,
          results
        });
      }
    }
  });
  
  return races;
}

/**
 * Extract overall championship standings
 */
function extractOverallStandings($) {
  const standings = [];
  
  // Look for overall standings table
  const standingsSelectors = [
    '.overall-standings table',
    '.championship-standings table',
    'table.standings',
    '#overall-results table',
    'table:contains("Overall")',
    'table:contains("Total")'
  ];
  
  let $standingsTable = null;
  for (const selector of standingsSelectors) {
    const $table = $(selector).first();
    if ($table.length > 0) {
      $standingsTable = $table;
      break;
    }
  }
  
  if (!$standingsTable) {
    // Try to find the largest table (likely to be standings)
    let maxRows = 0;
    $('table').each((index, table) => {
      const rowCount = $(table).find('tr').length;
      if (rowCount > maxRows) {
        maxRows = rowCount;
        $standingsTable = $(table);
      }
    });
  }
  
  if ($standingsTable) {
    $standingsTable.find('tbody tr, tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        const standing = {
          position: extractNumber(cells.eq(0).text()),
          sailNumber: cells.eq(1).text().trim(),
          helmName: cells.eq(2).text().trim(),
          crewName: null,
          club: null,
          totalPoints: null,
          netPoints: null,
          raceScores: []
        };
        
        // Extract crew, club, and points based on column count
        let colIndex = 3;
        
        // Check if next column looks like a name (crew)
        const col3Text = cells.eq(colIndex).text().trim();
        if (col3Text && !col3Text.match(/^\d/) && col3Text.length > 2) {
          standing.crewName = col3Text;
          colIndex++;
        }
        
        // Check for club/country column
        const col4Text = cells.eq(colIndex).text().trim();
        if (col4Text && !col4Text.match(/^\d/) && (col4Text.includes('(') || col4Text.length <= 6)) {
          standing.club = col4Text;
          colIndex++;
        }
        
        // Extract race scores (usually in middle columns)
        const totalCells = cells.length;
        const pointsCells = 2; // Usually last 2 columns are total and net points
        
        for (let i = colIndex; i < totalCells - pointsCells; i++) {
          const scoreText = cells.eq(i).text().trim();
          if (scoreText) {
            standing.raceScores.push(parseRaceScore(scoreText));
          }
        }
        
        // Extract total and net points (usually last two columns)
        if (totalCells >= 2) {
          standing.totalPoints = extractNumber(cells.eq(-2).text());
          standing.netPoints = extractNumber(cells.eq(-1).text());
        }
        
        if (standing.sailNumber) {
          standings.push(standing);
        }
      }
    });
  }
  
  return standings;
}

/**
 * Parse individual race score (handles discards)
 */
function parseRaceScore(scoreText) {
  const score = {
    points: null,
    position: null,
    isDiscarded: false,
    status: 'finished'
  };
  
  // Check for discarded scores (in parentheses or strikethrough)
  if (scoreText.includes('(') || scoreText.includes('[')) {
    score.isDiscarded = true;
    scoreText = scoreText.replace(/[(\[\])]/, '');
  }
  
  // Check for special statuses
  const statusMatch = scoreText.match(/\b(DNF|DNS|DSQ|OCS|BFD|RET|DNC)\b/i);
  if (statusMatch) {
    score.status = statusMatch[1].toUpperCase();
    score.points = getStatusPoints(score.status);
  } else {
    const num = extractNumber(scoreText);
    if (num !== null) {
      score.position = num;
      score.points = num;
    }
  }
  
  return score;
}

/**
 * Get points for special statuses
 */
function getStatusPoints(status) {
  // These would typically be number of entries + 1
  const statusPoints = {
    'DNF': 999,
    'DNS': 999,
    'DSQ': 999,
    'OCS': 999,
    'BFD': 999,
    'RET': 999,
    'DNC': 999
  };
  
  return statusPoints[status] || 999;
}

/**
 * Extract divisions/fleets
 */
function extractDivisions($) {
  const divisions = [];
  
  // Look for division indicators
  const divisionSelectors = [
    '.division-results',
    '.fleet-results',
    '[class*="division"]',
    '[class*="fleet"]'
  ];
  
  divisionSelectors.forEach(selector => {
    $(selector).each((index, element) => {
      const $el = $(element);
      const divisionName = extractDivisionName($el);
      
      if (divisionName) {
        divisions.push({
          name: divisionName,
          competitors: extractDivisionCompetitors($, $el)
        });
      }
    });
  });
  
  // If no explicit divisions, check for color-coded fleets
  if (divisions.length === 0) {
    const fleetColors = ['Red', 'Blue', 'Yellow', 'Green', 'White'];
    fleetColors.forEach(color => {
      const regex = new RegExp(color + '\\s*(?:Fleet|Division)', 'i');
      if ($('body').text().match(regex)) {
        divisions.push({
          name: color,
          competitors: []
        });
      }
    });
  }
  
  return divisions;
}

/**
 * Extract division name
 */
function extractDivisionName($element) {
  const text = $element.find('h2, h3, h4, .title').first().text().trim();
  
  if (text) {
    return text.replace(/Results?|Standings?/gi, '').trim();
  }
  
  return null;
}

/**
 * Extract competitors in a division
 */
function extractDivisionCompetitors($, $element) {
  const competitors = [];
  
  $element.find('tr, li, .competitor').each((index, item) => {
    const $item = $(item);
    const sailNumber = extractSailNumber($item.text());
    
    if (sailNumber) {
      competitors.push(sailNumber);
    }
  });
  
  return competitors;
}

/**
 * Extract metadata about the results
 */
function extractMetadata($) {
  return {
    scrapedAt: new Date().toISOString(),
    source: 'racingrulesofsailing.org',
    totalRaces: countTotalRaces($),
    completedRaces: countCompletedRaces($),
    totalCompetitors: countCompetitors($),
    scoringSystem: extractScoringSystem($),
    lastRaceDate: extractLastRaceDate($)
  };
}

/**
 * Count total races
 */
function countTotalRaces($) {
  // Look for race headers or maximum race number
  let maxRace = 0;
  
  $('*').each((index, element) => {
    const text = $(element).text();
    const match = text.match(/Race\s*(\d+)/i);
    if (match) {
      const raceNum = parseInt(match[1]);
      if (raceNum > maxRace) {
        maxRace = raceNum;
      }
    }
  });
  
  return maxRace;
}

/**
 * Count completed races
 */
function countCompletedRaces($) {
  // Count races with results
  const raceNumbers = new Set();
  
  $('.race-results, [class*="race"]').each((index, element) => {
    const text = $(element).text();
    const match = text.match(/Race\s*(\d+)/i);
    if (match) {
      raceNumbers.add(parseInt(match[1]));
    }
  });
  
  return raceNumbers.size;
}

/**
 * Count total competitors
 */
function countCompetitors($) {
  const sailNumbers = new Set();
  
  $('td, li').each((index, element) => {
    const sailNumber = extractSailNumber($(element).text());
    if (sailNumber) {
      sailNumbers.add(sailNumber);
    }
  });
  
  return sailNumbers.size;
}

/**
 * Extract scoring system
 */
function extractScoringSystem($) {
  const text = $('body').text().toLowerCase();
  
  if (text.includes('low point')) {
    return 'Low Point System';
  }
  if (text.includes('high point')) {
    return 'High Point System';
  }
  if (text.includes('bonus point')) {
    return 'Bonus Point System';
  }
  
  return 'Low Point System'; // Default
}

/**
 * Extract last race date
 */
function extractLastRaceDate($) {
  let lastDate = null;
  
  // Look for date patterns
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
    /(\w+ \d{1,2}, \d{4})/g,
    /(\d{4}-\d{2}-\d{2})/g
  ];
  
  datePatterns.forEach(pattern => {
    const matches = $('body').text().match(pattern);
    if (matches) {
      matches.forEach(match => {
        try {
          const date = new Date(match);
          if (!isNaN(date.getTime()) && (!lastDate || date > lastDate)) {
            lastDate = date;
          }
        } catch (e) {
          // Invalid date
        }
      });
    }
  });
  
  return lastDate ? lastDate.toISOString() : null;
}

/**
 * Extract race date from table context
 */
function extractRaceDate($table) {
  const contextText = $table.prev().text() + ' ' + $table.next().text();
  
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
    /(\w+ \d{1,2}, \d{4})/,
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = contextText.match(pattern);
    if (match) {
      try {
        return new Date(match[1]).toISOString();
      } catch (e) {
        // Invalid date
      }
    }
  }
  
  return null;
}

/**
 * Extract race conditions
 */
function extractRaceConditions($, $table) {
  const contextText = $table.parent().text();
  const conditions = {};
  
  // Wind speed
  const windMatch = contextText.match(/(\d+(?:-\d+)?)\s*(?:kts?|knots?)/i);
  if (windMatch) {
    conditions.windSpeed = windMatch[1];
  }
  
  // Wind direction
  const dirMatch = contextText.match(/\b([NESW]{1,3})\b/);
  if (dirMatch) {
    conditions.windDirection = dirMatch[1];
  }
  
  // Course type
  if (contextText.match(/windward[- ]leeward/i)) {
    conditions.course = 'Windward-Leeward';
  } else if (contextText.match(/triangle/i)) {
    conditions.course = 'Triangle';
  }
  
  return conditions;
}

/**
 * Extract sail number from text
 */
function extractSailNumber(text) {
  const match = text.match(/\b([A-Z]{2,3}\s*\d{1,4})\b/);
  return match ? match[1].trim() : null;
}

/**
 * Extract number from text
 */
function extractNumber(text) {
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

module.exports = {
  scrapeRaceResults,
  parseRaceTable,
  extractOverallStandings,
  EVENT_CONFIG
};