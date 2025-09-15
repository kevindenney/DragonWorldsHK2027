const functions = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const axios = require('axios');
const pdf = require('pdf-parse');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * CCR 2024 PDF URLs from RHKYC
 */
const CCR_2024_PDFS = {
  'hong-kong-kettle': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/Hong%20Kong%20Kettle%2024%20Results.pdf',
  'irc-racer-0': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRC0.pdf',
  'irc-cape-31': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRCCape31.pdf',
  'irc-racer-2': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRC2.pdf',
  'irc-racer-3': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRC3.pdf',
  'irc-premier-cruiser': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRCPremier%20Cruiser.pdf',
  'phs': 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024PHS.pdf'
};

/**
 * Parse sailing results from PDF text
 * @param {string} pdfText - Raw text from PDF
 * @param {string} divisionId - Division identifier
 * @returns {Object} Parsed sailing results
 */
function parseSailingResults(pdfText, divisionId) {
  console.log(`Parsing ${divisionId} results...`);
  console.log('PDF Text length:', pdfText.length);
  console.log('First 500 chars:', pdfText.substring(0, 500));

  // Basic parsing - look for common sailing result patterns
  const boats = [];
  const lines = pdfText.split('\n').filter(line => line.trim());
  
  // Common sailing result patterns to look for:
  // - Boat names
  // - Points (total/net)
  // - Race results (numbers)
  // - Skipper names
  
  let currentBoat = null;
  let position = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.includes('PROVISIONAL') || line.includes('RESULTS')) {
      continue;
    }
    
    // Look for boat names (usually contain letters and may have numbers)
    if (line.match(/[A-Za-z]/)) {
      // Check if this looks like a boat entry
      const nextLines = lines.slice(i, i + 5).join(' ');
      
      // Look for points patterns (numbers with decimals)
      const pointsMatch = nextLines.match(/(\d+\.?\d*)\s*pts?/i);
      const raceResultsMatch = nextLines.match(/(\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?)*)/);
      
      if (pointsMatch || raceResultsMatch) {
        currentBoat = {
          boatName: line,
          position: position++,
          totalPoints: pointsMatch ? parseFloat(pointsMatch[1]) : 0,
          netPoints: pointsMatch ? parseFloat(pointsMatch[1]) : 0,
          raceResults: [],
          skipper: 'TBD',
          crew: ['TBD'],
          sailNumber: `${divisionId.toUpperCase()}-${position}`,
          yachtClub: 'TBD'
        };
        
        // Try to extract race results if found
        if (raceResultsMatch) {
          const results = raceResultsMatch[1].split(/\s+/).map(r => parseFloat(r)).filter(r => !isNaN(r));
          currentBoat.raceResults = results;
        }
        
        boats.push(currentBoat);
        console.log(`Found boat: ${currentBoat.boatName} with ${currentBoat.totalPoints} points`);
      }
    }
  }
  
  return {
    division: divisionId,
    boats: boats,
    lastUpdated: admin.firestore.Timestamp.now(),
    source: 'RHKYC_PDF'
  };
}

/**
 * Calculate net points with proper discard rules
 * @param {Array} raceResults - Array of race scores
 * @param {number} numRaces - Total number of races
 * @returns {Object} Net points calculation
 */
function calculateNetPoints(raceResults, numRaces = 7) {
  if (!raceResults || raceResults.length === 0) {
    return { netPoints: 0, discardedRaces: [] };
  }
  
  const totalPoints = raceResults.reduce((sum, points) => sum + points, 0);
  
  // Apply discard rules: 1 drop after 5 races, 2 drops after 10 races
  if (numRaces >= 5) {
    const sortedResults = [...raceResults]
      .map((points, index) => ({ points, index }))
      .sort((a, b) => b.points - a.points); // Sort descending (worst first)
    
    const numDrops = numRaces >= 10 ? 2 : 1;
    const droppedRaces = sortedResults.slice(0, numDrops);
    
    const netPoints = raceResults.reduce((sum, points, idx) => {
      const isDropped = droppedRaces.some(d => d.index === idx);
      return isDropped ? sum : sum + points;
    }, 0);
    
    return { netPoints, discardedRaces: droppedRaces.map(d => d.index), totalPoints };
  }
  
  return { netPoints: totalPoints, discardedRaces: [], totalPoints };
}

/**
 * Cloud Function to scrape CCR 2024 results from PDFs
 */
exports.scrapeCCR2024Results = functions.https.onCall(async (data, context) => {
  try {
    console.log('Starting CCR 2024 PDF scraping...');
    
    const results = {
      eventData: {
        id: 'ccr-2024',
        name: 'China Coast Regatta 2024',
        location: 'Hong Kong',
        startDate: '2024-10-11',
        endDate: '2024-10-13',
        totalRaces: 7,
        racesCompleted: 7,
        status: 'completed'
      },
      divisions: {},
      scrapedAt: admin.firestore.Timestamp.now()
    };
    
    // Process each division PDF
    for (const [divisionId, pdfUrl] of Object.entries(CCR_2024_PDFS)) {
      try {
        console.log(`Processing ${divisionId}: ${pdfUrl}`);
        
        // Download PDF
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CCR2024-Scraper/1.0)'
          }
        });
        
        console.log(`Downloaded ${divisionId} PDF, size: ${response.data.length} bytes`);
        
        // Parse PDF
        const pdfData = await pdf(response.data);
        console.log(`Extracted text from ${divisionId}, length: ${pdfData.text.length} chars`);
        
        // Parse sailing results
        const divisionResults = parseSailingResults(pdfData.text, divisionId);
        
        // Calculate proper net points for each boat
        divisionResults.boats = divisionResults.boats.map(boat => {
          const { netPoints, discardedRaces, totalPoints } = calculateNetPoints(boat.raceResults);
          return {
            ...boat,
            netPoints,
            totalPoints: totalPoints || boat.totalPoints,
            discardedRaces: discardedRaces || []
          };
        });
        
        results.divisions[divisionId] = divisionResults;
        console.log(`Successfully processed ${divisionId}: ${divisionResults.boats.length} boats`);
        
      } catch (error) {
        console.error(`Failed to process ${divisionId}:`, error.message);
        results.divisions[divisionId] = {
          division: divisionId,
          boats: [],
          error: error.message,
          lastUpdated: admin.firestore.Timestamp.now()
        };
      }
    }
    
    // Store results in Firestore
    const firestore = admin.firestore();
    await firestore.collection('raceResults').doc('ccr2024').set(results);
    
    console.log('CCR 2024 results stored in Firestore successfully');
    
    return {
      success: true,
      message: 'CCR 2024 results scraped and stored successfully',
      divisionsProcessed: Object.keys(results.divisions).length,
      results: results
    };
    
  } catch (error) {
    console.error('Error scraping CCR 2024 results:', error);
    throw new functions.https.HttpsError('internal', 'Failed to scrape CCR 2024 results', error.message);
  }
});

/**
 * Scheduled function to update CCR 2024 results periodically
 */
exports.updateCCR2024Results = onSchedule({
  schedule: 'every 6 hours',
  timeZone: 'Asia/Hong_Kong',
  memory: '512MiB',
  timeoutSeconds: 300
}, async (event) => {
  console.log('Running scheduled CCR 2024 results update...');
  try {
    // Call the scraping function
    await exports.scrapeCCR2024Results({}, { auth: { uid: 'system' } });
    console.log('Scheduled CCR 2024 update completed successfully');
  } catch (error) {
    console.error('Scheduled CCR 2024 update failed:', error);
  }
});