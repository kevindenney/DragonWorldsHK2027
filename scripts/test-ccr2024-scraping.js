#!/usr/bin/env node

/**
 * Test script to call the CCR 2024 PDF scraping Cloud Function
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFunctions, connectFunctionsEmulator } = require('firebase/functions');
const { getFirestore } = require('firebase-admin/firestore');

async function testCCR2024Scraping() {
  try {
    console.log('🔥 Testing CCR 2024 PDF scraping...');
    
    // For testing, we'll use the Firestore emulator
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    // Initialize Firebase Admin
    if (!require('firebase-admin').apps.length) {
      require('firebase-admin').initializeApp();
    }
    
    // Import the function locally
    const { scrapeCCR2024Results } = require('../functions/scrapeCCR2024Results');
    
    // Test the function
    console.log('📡 Calling scrapeCCR2024Results function...');
    const result = await scrapeCCR2024Results.run({}, { auth: { uid: 'test-user' } });
    
    console.log('✅ Function completed successfully!');
    console.log('📊 Results summary:', {
      success: result.success,
      message: result.message,
      divisionsProcessed: result.divisionsProcessed,
      totalBoats: result.results?.divisions ? 
        Object.values(result.results.divisions).reduce((total, div) => 
          total + (div.boats?.length || 0), 0) : 0
    });
    
    // Log some sample results
    if (result.results?.divisions) {
      console.log('\n📋 Sample results:');
      for (const [divisionId, divisionData] of Object.entries(result.results.divisions)) {
        console.log(`\n${divisionId.toUpperCase()}:`);
        if (divisionData.boats && divisionData.boats.length > 0) {
          divisionData.boats.slice(0, 3).forEach((boat, index) => {
            console.log(`  ${index + 1}. ${boat.boatName} - ${boat.totalPoints} pts`);
          });
          if (divisionData.boats.length > 3) {
            console.log(`  ... and ${divisionData.boats.length - 3} more boats`);
          }
        } else {
          console.log(`  ❌ No boats found (${divisionData.error || 'unknown error'})`);
        }
      }
    }
    
    // Check Firestore
    console.log('\n🔥 Checking Firestore...');
    const firestore = getFirestore();
    const docRef = firestore.collection('raceResults').doc('ccr2024');
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      console.log('✅ Data successfully stored in Firestore');
      console.log('📊 Firestore data summary:', {
        eventName: data.eventData?.name,
        divisions: Object.keys(data.divisions || {}),
        scrapedAt: data.scrapedAt?.toDate?.()?.toISOString()
      });
    } else {
      console.log('❌ No data found in Firestore');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📝 Error details:', error);
  }
}

// Run the test
testCCR2024Scraping()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });