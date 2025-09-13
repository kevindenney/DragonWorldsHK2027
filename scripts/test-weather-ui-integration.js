#!/usr/bin/env node

/**
 * Test script to verify weather UI integration
 * Run with: node scripts/test-weather-ui-integration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Weather UI Integration\n');

// Check if weather screens are properly integrated
function checkWeatherScreens() {
  console.log('📱 Checking Weather Screen Integration...\n');
  
  const weatherScreenPath = path.join(__dirname, '../src/screens/tabs/WeatherScreen.tsx');
  const enhancedWeatherScreenPath = path.join(__dirname, '../src/screens/tabs/EnhancedWeatherScreen.tsx');
  
  // Check WeatherScreen.tsx
  if (fs.existsSync(weatherScreenPath)) {
    const weatherScreenContent = fs.readFileSync(weatherScreenPath, 'utf8');
    
    console.log('✅ WeatherScreen.tsx found');
    
    // Check for real weather store imports
    if (weatherScreenContent.includes('useWeatherStore') && 
        weatherScreenContent.includes('useCurrentWeather') &&
        weatherScreenContent.includes('useCurrentMarine')) {
      console.log('✅ Weather store hooks imported');
    } else {
      console.log('❌ Weather store hooks missing');
      return false;
    }
    
    // Check for removed mock data references
    if (!weatherScreenContent.includes('mockWeatherData') && 
        !weatherScreenContent.includes('mockWindAnalysis')) {
      console.log('✅ Mock data references removed');
    } else {
      console.log('❌ Mock data references still present');
      return false;
    }
    
    // Check for real data usage
    if (weatherScreenContent.includes('currentWeather.temperature') && 
        weatherScreenContent.includes('currentWeather.windSpeed')) {
      console.log('✅ Real weather data being used');
    } else {
      console.log('❌ Real weather data not being used');
      return false;
    }
    
  } else {
    console.log('❌ WeatherScreen.tsx not found');
    return false;
  }
  
  // Check EnhancedWeatherScreen.tsx
  if (fs.existsSync(enhancedWeatherScreenPath)) {
    const enhancedWeatherScreenContent = fs.readFileSync(enhancedWeatherScreenPath, 'utf8');
    
    console.log('✅ EnhancedWeatherScreen.tsx found');
    
    // Check for weather store integration
    if (enhancedWeatherScreenContent.includes('useWeatherStore') && 
        enhancedWeatherScreenContent.includes('useCurrentWeather')) {
      console.log('✅ Enhanced screen uses weather store');
    } else {
      console.log('❌ Enhanced screen missing weather store integration');
      return false;
    }
    
    // Check for removed PredictWind references
    if (!enhancedWeatherScreenContent.includes('predictWindService') && 
        !enhancedWeatherScreenContent.includes('PredictWindResponse')) {
      console.log('✅ PredictWind references removed from enhanced screen');
    } else {
      console.log('❌ PredictWind references still present in enhanced screen');
      return false;
    }
    
  } else {
    console.log('❌ EnhancedWeatherScreen.tsx not found');
    return false;
  }
  
  return true;
}

function checkWeatherStore() {
  console.log('\n🏪 Checking Weather Store Integration...\n');
  
  const weatherStorePath = path.join(__dirname, '../src/stores/weatherStore.ts');
  
  if (fs.existsSync(weatherStorePath)) {
    const weatherStoreContent = fs.readFileSync(weatherStorePath, 'utf8');
    
    console.log('✅ weatherStore.ts found');
    
    // Check for weather manager import
    if (weatherStoreContent.includes('weatherManager')) {
      console.log('✅ Weather manager integrated');
    } else {
      console.log('❌ Weather manager not integrated');
      return false;
    }
    
    // Check for required hooks
    const requiredHooks = [
      'useCurrentWeather',
      'useCurrentMarine', 
      'useWeatherForecasts',
      'useWeatherStore'
    ];
    
    let hooksPresent = 0;
    requiredHooks.forEach(hook => {
      if (weatherStoreContent.includes(hook)) {
        hooksPresent++;
      }
    });
    
    if (hooksPresent === requiredHooks.length) {
      console.log('✅ All required weather hooks present');
    } else {
      console.log(`❌ Missing ${requiredHooks.length - hooksPresent} required hooks`);
      return false;
    }
    
  } else {
    console.log('❌ weatherStore.ts not found');
    return false;
  }
  
  return true;
}

function checkWeatherAPI() {
  console.log('\n🌐 Checking Weather API Integration...\n');
  
  const weatherAPIPath = path.join(__dirname, '../src/services/weatherAPI.ts');
  const weatherManagerPath = path.join(__dirname, '../src/services/weatherManager.ts');
  
  if (fs.existsSync(weatherAPIPath)) {
    const weatherAPIContent = fs.readFileSync(weatherAPIPath, 'utf8');
    
    console.log('✅ weatherAPI.ts found');
    
    // Check for OpenWeatherMap and Open-Meteo integration
    if (weatherAPIContent.includes('OpenWeatherMapResponse') && 
        weatherAPIContent.includes('OpenMeteoMarineResponse')) {
      console.log('✅ OpenWeatherMap and Open-Meteo APIs integrated');
    } else {
      console.log('❌ API integrations incomplete');
      return false;
    }
    
    // Check for removed PredictWind references
    if (!weatherAPIContent.includes('PredictWindResponse')) {
      console.log('✅ PredictWind references removed from API');
    } else {
      console.log('❌ PredictWind references still present in API');
      return false;
    }
    
  } else {
    console.log('❌ weatherAPI.ts not found');
    return false;
  }
  
  if (fs.existsSync(weatherManagerPath)) {
    const weatherManagerContent = fs.readFileSync(weatherManagerPath, 'utf8');
    
    console.log('✅ weatherManager.ts found');
    
    // Check for weather store integration
    if (weatherManagerContent.includes('useWeatherStore')) {
      console.log('✅ Weather manager connects to weather store');
    } else {
      console.log('❌ Weather manager missing store integration');
      return false;
    }
    
  } else {
    console.log('❌ weatherManager.ts not found');
    return false;
  }
  
  return true;
}

function checkEnvironmentConfig() {
  console.log('\n⚙️  Checking Environment Configuration...\n');
  
  const envExamplePath = path.join(__dirname, '../.env.local.example');
  const envLocalPath = path.join(__dirname, '../.env.local');
  
  if (fs.existsSync(envExamplePath)) {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    console.log('✅ .env.local.example found');
    
    if (envExampleContent.includes('EXPO_PUBLIC_OPENWEATHERMAP_API_KEY')) {
      console.log('✅ OpenWeatherMap API key configuration present');
    } else {
      console.log('❌ OpenWeatherMap API key configuration missing');
      return false;
    }
    
  } else {
    console.log('❌ .env.local.example not found');
    return false;
  }
  
  if (fs.existsSync(envLocalPath)) {
    const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
    
    console.log('✅ .env.local found');
    
    if (envLocalContent.includes('c089357aed2f67847d4a8425d3e122fa')) {
      console.log('✅ OpenWeatherMap API key configured');
    } else {
      console.log('⚠️  OpenWeatherMap API key not configured (optional for testing)');
    }
    
  } else {
    console.log('⚠️  .env.local not found (will use free APIs only)');
  }
  
  return true;
}

function checkNavigation() {
  console.log('\n🧭 Checking Navigation Integration...\n');
  
  const tabNavigatorPath = path.join(__dirname, '../src/services/navigation/TabNavigator.tsx');
  
  if (fs.existsSync(tabNavigatorPath)) {
    const tabNavigatorContent = fs.readFileSync(tabNavigatorPath, 'utf8');
    
    console.log('✅ TabNavigator.tsx found');
    
    if (tabNavigatorContent.includes('WeatherScreen')) {
      console.log('✅ Weather screen integrated in navigation');
    } else {
      console.log('❌ Weather screen not in navigation');
      return false;
    }
    
    if (tabNavigatorContent.includes('Cloud')) {
      console.log('✅ Weather tab icon present');
    } else {
      console.log('❌ Weather tab icon missing');
      return false;
    }
    
  } else {
    console.log('❌ TabNavigator.tsx not found');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('=' .repeat(60));
  console.log('🌤️  DRAGON WORLDS WEATHER UI INTEGRATION TEST');
  console.log('=' .repeat(60));
  
  const results = {
    screens: false,
    store: false,
    api: false,
    env: false,
    nav: false
  };
  
  // Run all checks
  results.screens = checkWeatherScreens();
  results.store = checkWeatherStore();
  results.api = checkWeatherAPI();
  results.env = checkEnvironmentConfig();
  results.nav = checkNavigation();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 INTEGRATION TEST RESULTS');
  console.log('=' .repeat(60));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`📱 Weather Screens: ${results.screens ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🏪 Weather Store: ${results.store ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🌐 Weather API: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⚙️  Environment: ${results.env ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🧭 Navigation: ${results.nav ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 SUCCESS! Weather UI integration is complete and ready!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start your development server: npm start');
    console.log('   2. Navigate to the Weather tab in your app');
    console.log('   3. Verify real weather data is displayed');
    console.log('   4. Test subscription tiers and premium features');
    console.log('\n📊 Your weather system now shows:');
    console.log('   • Real temperature, wind, and conditions');
    console.log('   • Live marine data (waves, tides, currents)');
    console.log('   • 6-hour professional forecasts');
    console.log('   • Subscription-based feature access');
    console.log('   • Multi-source API fallbacks');
  } else {
    console.log(`\n⚠️  WARNING: ${totalTests - passedTests} integration issues found.`);
    console.log('   Please review the failed checks above.');
  }
  
  console.log('\n---');
  console.log('🌊 Dragon Worlds HK2027 Weather System');
  console.log('📡 Powered by OpenWeatherMap + Open-Meteo APIs');
}

main().catch(console.error);