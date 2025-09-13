#!/usr/bin/env node

/**
 * Wind Data Refresh Script
 * 
 * This script helps refresh the wind data in the app by clearing caches
 * and providing instructions for testing the updated wind station data.
 */

const { windStationService } = require('../src/services/windStationService');

async function refreshWindData() {
  console.log('🌬️ WIND DATA REFRESH SCRIPT');
  console.log('============================');
  
  try {
    // Clear the wind station cache
    console.log('🧹 Clearing wind station cache...');
    windStationService.clearCache();
    
    // Force refresh wind stations
    console.log('🔄 Force refreshing wind stations...');
    const stations = await windStationService.forceRefreshWindStations();
    
    console.log(`✅ Successfully loaded ${stations.length} wind stations`);
    console.log('\n📊 WIND STATION DATA:');
    console.log('====================');
    
    // Display sample of wind stations with varied data
    stations.slice(0, 10).forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   Location: ${station.coordinate.latitude.toFixed(3)}, ${station.coordinate.longitude.toFixed(3)}`);
      console.log(`   Wind: ${station.windSpeed} kts @ ${station.windDirection}°`);
      console.log(`   Quality: ${station.dataQuality}`);
      console.log('');
    });
    
    console.log('🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Restart your React Native app (Expo Go)');
    console.log('2. Navigate to the Weather tab');
    console.log('3. Look at the wind markers on the map');
    console.log('4. You should now see varied wind speeds (2-15 kts) instead of uniform "9 kts"');
    console.log('5. Pull down to refresh if needed');
    
    console.log('\n🔍 DEBUGGING:');
    console.log('=============');
    console.log('If you still see "9 kts" everywhere:');
    console.log('- Check the console logs for wind station loading messages');
    console.log('- Look for "🌬️ LOADING WIND STATIONS" and "✅ WIND STATIONS LOADED" messages');
    console.log('- The cache has been cleared, so fresh data should load');
    
  } catch (error) {
    console.error('❌ Error refreshing wind data:', error);
  }
}

// Run the script
refreshWindData();
