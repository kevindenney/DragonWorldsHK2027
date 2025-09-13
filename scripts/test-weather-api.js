#!/usr/bin/env node

/**
 * Test script to verify weather API integration
 * Run with: node scripts/test-weather-api.js
 */

const https = require('https');

// Hong Kong Dragon Worlds racing area
const RACING_AREA_LAT = 22.3500;
const RACING_AREA_LON = 114.2500;

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testOpenMeteoMarine() {
  console.log('🌊 Testing Open-Meteo Marine API (Free)...');
  
  try {
    const marineParams = [
      'wave_height',
      'wave_direction', 
      'wave_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period'
    ].join(',');

    const url = `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${RACING_AREA_LAT}&longitude=${RACING_AREA_LON}&` +
      `hourly=${marineParams}&` +
      `timezone=Asia%2FHong_Kong&forecast_days=1`;

    console.log(`  URL: ${url}`);
    
    const data = await makeRequest(url);
    
    if (data.hourly && data.hourly.time) {
      console.log('  ✅ Open-Meteo Marine API working!');
      console.log(`  📊 Got ${data.hourly.time.length} hourly forecasts`);
      
      if (data.hourly.wave_height && data.hourly.wave_height[0] !== null) {
        console.log(`  🌊 First wave height: ${data.hourly.wave_height[0]}m`);
      }
      
      return true;
    } else {
      console.log('  ⚠️  Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Open-Meteo Marine API failed: ${error.message}`);
    return false;
  }
}

async function testHKObservatory() {
  console.log('🇭🇰 Testing Hong Kong Observatory API (Free)...');
  
  try {
    const url = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en';
    console.log(`  URL: ${url}`);
    
    const data = await makeRequest(url);
    
    if (data.temperature && Array.isArray(data.temperature)) {
      console.log('  ✅ Hong Kong Observatory API working!');
      
      if (data.temperature[0] && data.temperature[0].value) {
        console.log(`  🌡️  Current temperature: ${data.temperature[0].value}°C at ${data.temperature[0].place}`);
      }
      
      if (data.windSpeed && data.windSpeed[0] && data.windSpeed[0].value) {
        console.log(`  💨 Wind speed: ${data.windSpeed[0].value} km/h`);
      }
      
      return true;
    } else {
      console.log('  ⚠️  Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Hong Kong Observatory API failed: ${error.message}`);
    return false;
  }
}

async function testNOAATides() {
  console.log('🌊 Testing NOAA Tides API (Free)...');
  
  try {
    // Using a generic Hong Kong area station
    const stationId = '1611400';
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
      `date=today&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&` +
      `units=metric&format=json&application=DragonWorlds`;
    
    console.log(`  URL: ${url}`);
    
    const data = await makeRequest(url);
    
    if (data.predictions && Array.isArray(data.predictions)) {
      console.log('  ✅ NOAA Tides API working!');
      console.log(`  📊 Got ${data.predictions.length} tide predictions`);
      
      if (data.predictions[0]) {
        console.log(`  🌊 First tide: ${data.predictions[0].v}m at ${data.predictions[0].t}`);
      }
      
      return true;
    } else if (data.error) {
      console.log(`  ⚠️  NOAA API returned error: ${data.error.message}`);
      return false;
    } else {
      console.log('  ⚠️  Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ NOAA Tides API failed: ${error.message}`);
    return false;
  }
}

async function testOpenWeatherMap() {
  console.log('☁️  Testing OpenWeatherMap API (Requires API Key)...');
  
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;
  
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    console.log('  ⚠️  OpenWeatherMap API key not configured - skipping test');
    console.log('  💡 Set EXPO_PUBLIC_OPENWEATHERMAP_API_KEY to test this API');
    return null;
  }
  
  try {
    // Note: Using the 2.5 API for testing as 3.0 requires subscription
    const url = `https://api.openweathermap.org/data/2.5/weather?` +
      `lat=${RACING_AREA_LAT}&lon=${RACING_AREA_LON}&` +
      `appid=${apiKey}&units=metric`;
    
    console.log(`  URL: ${url.replace(apiKey, '[API_KEY]')}`);
    
    const data = await makeRequest(url);
    
    if (data.main && data.wind) {
      console.log('  ✅ OpenWeatherMap API working!');
      console.log(`  🌡️  Temperature: ${data.main.temp}°C`);
      console.log(`  💨 Wind: ${(data.wind.speed * 1.94384).toFixed(1)} knots at ${data.wind.deg}°`);
      
      if (data.weather && data.weather[0]) {
        console.log(`  ☁️  Conditions: ${data.weather[0].description}`);
      }
      
      return true;
    } else if (data.cod && data.message) {
      console.log(`  ❌ OpenWeatherMap API error: ${data.message} (Code: ${data.cod})`);
      return false;
    } else {
      console.log('  ⚠️  Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ OpenWeatherMap API failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Weather API Integration for Dragon Worlds HK2027\n');
  console.log(`📍 Testing location: ${RACING_AREA_LAT}, ${RACING_AREA_LON} (Hong Kong racing area)\n`);
  
  const results = {};
  
  // Test free APIs
  results.openMeteo = await testOpenMeteoMarine();
  console.log('');
  
  results.hko = await testHKObservatory();
  console.log('');
  
  results.noaa = await testNOAATides();
  console.log('');
  
  // Test API key-based services
  results.openWeatherMap = await testOpenWeatherMap();
  console.log('');
  
  // Summary
  console.log('📋 Test Results Summary:');
  console.log('========================');
  
  const freeAPIsWorking = [results.openMeteo, results.hko].filter(Boolean).length;
  const totalFreeAPIs = 2;
  
  console.log(`🆓 Free APIs: ${freeAPIsWorking}/${totalFreeAPIs} working`);
  console.log(`   • Open-Meteo Marine: ${results.openMeteo ? '✅' : '❌'}`);
  console.log(`   • Hong Kong Observatory: ${results.hko ? '✅' : '❌'}`);
  console.log(`   • NOAA Tides: ${results.noaa ? '✅' : '❌'}`);
  
  if (results.openWeatherMap !== null) {
    console.log(`🔑 Premium APIs: ${results.openWeatherMap ? '1/1' : '0/1'} working`);
    console.log(`   • OpenWeatherMap: ${results.openWeatherMap ? '✅' : '❌'}`);
  } else {
    console.log(`🔑 Premium APIs: Not tested (no API keys configured)`);
  }
  
  console.log('');
  
  if (freeAPIsWorking >= 1) {
    console.log('🎉 Great! Your weather system has working data sources.');
    console.log('💡 The app will work with free APIs. Add OpenWeatherMap API key for enhanced features.');
  } else {
    console.log('⚠️  Warning: No working weather APIs found. Please check your internet connection.');
  }
  
  console.log('\n📖 Next Steps:');
  console.log('• Copy .env.local.example to .env.local');
  console.log('• Add your OpenWeatherMap API key to .env.local for premium features');
  console.log('• Start your Expo development server: npm start');
}

// Run the tests
main().catch(console.error);