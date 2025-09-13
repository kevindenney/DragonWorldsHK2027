#!/usr/bin/env node

/**
 * Test script for race data integration
 * Tests Firebase Functions, Firestore connection, and data scraping
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const CONFIG = {
  functionsUrl: process.env.FIREBASE_FUNCTIONS_URL || 'http://127.0.0.1:5001/dragonworldshk2027/us-central1',
  testEventId: 'dragon-worlds-2027',
  timeout: 30000,
  isLocal: true
};

console.log('🏁 Dragon Worlds HK 2027 - Race Data Integration Test');
console.log('=' .repeat(60));

// Test functions
async function testFunctionEndpoint(endpoint, params = {}) {
  const url = new URL(`${CONFIG.functionsUrl}/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  console.log(`📡 Testing ${endpoint}...`);
  console.log(`   URL: ${url.toString()}`);
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout after ${CONFIG.timeout}ms`));
    }, CONFIG.timeout);
    
    const protocol = CONFIG.isLocal ? http : https;
    const req = protocol.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const tests = [
    {
      name: 'Scrape Event Data',
      endpoint: 'scrapeRaceData',
      params: { eventId: CONFIG.testEventId, type: 'event' },
      validate: (response) => {
        return response.status === 200 && 
               response.data && 
               response.data.name;
      }
    },
    {
      name: 'Scrape Race Results',
      endpoint: 'scrapeRaceData',
      params: { eventId: CONFIG.testEventId, type: 'results' },
      validate: (response) => {
        return response.status === 200 && 
               response.data && 
               (response.data.races || response.data.overallStandings);
      }
    },
    {
      name: 'Scrape Competitors',
      endpoint: 'scrapeRaceData',
      params: { eventId: CONFIG.testEventId, type: 'competitors' },
      validate: (response) => {
        return response.status === 200 && 
               response.data && 
               response.data.competitors;
      }
    },
    {
      name: 'Scrape Notice Board',
      endpoint: 'scrapeNoticeBoard',
      params: { eventId: CONFIG.testEventId },
      validate: (response) => {
        return response.status === 200 && 
               response.data && 
               response.data.notices !== undefined;
      }
    },
    {
      name: 'Complete Data Sync',
      endpoint: 'syncRaceData',
      params: { eventId: CONFIG.testEventId },
      validate: (response) => {
        return response.status === 200 && 
               response.data && 
               response.data.success === true;
      }
    }
  ];
  
  console.log(`\n🧪 Running ${tests.length} integration tests...\n`);
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    
    try {
      console.log(`${i + 1}. ${test.name}`);
      const startTime = Date.now();
      
      const response = await testFunctionEndpoint(test.endpoint, test.params);
      const duration = Date.now() - startTime;
      
      const isValid = test.validate(response);
      
      if (isValid) {
        console.log(`   ✅ PASSED (${duration}ms)`);
        results.passed++;
        
        // Log some key data points
        if (response.data) {
          if (response.data.name) {
            console.log(`   📝 Event: ${response.data.name}`);
          }
          if (response.data.races) {
            console.log(`   🏁 Races: ${response.data.races.length}`);
          }
          if (response.data.overallStandings) {
            console.log(`   🏆 Standings: ${response.data.overallStandings.length}`);
          }
          if (response.data.competitors) {
            console.log(`   ⛵ Competitors: ${response.data.competitors.length}`);
          }
          if (response.data.notices) {
            console.log(`   📢 Notices: ${response.data.notices.length}`);
          }
          if (response.data.summary) {
            console.log(`   📊 Summary:`, response.data.summary);
          }
        }
      } else {
        console.log(`   ❌ FAILED (${duration}ms)`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        results.failed++;
      }
      
      results.tests.push({
        name: test.name,
        passed: isValid,
        duration,
        status: response.status,
        data: response.data
      });
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.failed++;
      results.tests.push({
        name: test.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay between tests to avoid rate limiting
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

async function testWebsiteAccess() {
  console.log('🌐 Testing website access...\n');
  
  const urls = [
    'https://www.racingrulesofsailing.org',
    'https://www.chinacoastraceweek.com',
    'https://www.rhkyc.org.hk'
  ];
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      console.log(`🔗 Testing ${urlObj.hostname}...`);
      
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          resolve({ status: res.statusCode, headers: res.headers });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Timeout')));
      });
      
      if (response.status < 400) {
        console.log(`   ✅ Accessible (Status: ${response.status})`);
      } else {
        console.log(`   ⚠️  Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('');
}

async function generateReport(results) {
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('');
  
  if (results.failed > 0) {
    console.log('❌ FAILED TESTS:');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.error || 'Validation failed'}`);
      });
    console.log('');
  }
  
  console.log('🔧 INTEGRATION STATUS:');
  if (results.passed === results.tests.length) {
    console.log('   🎉 ALL SYSTEMS OPERATIONAL');
    console.log('   🚢 Ready for Dragon Worlds HK 2027!');
  } else if (results.passed > 0) {
    console.log('   ⚠️  PARTIAL FUNCTIONALITY');
    console.log('   🔨 Some features need attention');
  } else {
    console.log('   🚨 INTEGRATION ISSUES');
    console.log('   🛠️  Requires troubleshooting');
  }
  
  console.log('');
  console.log('📝 NEXT STEPS:');
  
  if (results.failed > 0) {
    console.log('   1. Check Firebase Functions deployment');
    console.log('   2. Verify Firestore security rules');
    console.log('   3. Test scraping endpoints manually');
    console.log('   4. Check network connectivity');
  } else {
    console.log('   1. Deploy to production environment');
    console.log('   2. Configure scheduled scraping');
    console.log('   3. Set up monitoring and alerts');
    console.log('   4. Test with real race data');
  }
  
  console.log('');
  console.log('🏁 Dragon Worlds HK 2027 Integration Test Complete!');
  console.log('=' .repeat(60));
}

// Main execution
async function main() {
  try {
    // Test website access first
    await testWebsiteAccess();
    
    // Run function tests
    const results = await runTests();
    
    // Generate report
    await generateReport(results);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run tests
main();