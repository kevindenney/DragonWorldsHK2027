# Enabling Multi-Source Weather

## Your API Key Status

Your OpenWeatherMap API key has been configured:
- **API Key**: `YOUR_OPENWEATHER_API_KEY`
- **Status**: Currently showing "Invalid API key" (may take 2-3 hours to activate)
- **Location**: Configured in `src/services/areaForecastService.ts`

## Quick Enable Guide

### Step 1: Wait for API Key Activation
OpenWeatherMap API keys typically take 2-3 hours to activate after registration.

Test if your key is active:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?lat=22.285&lon=114.175&appid=YOUR_OPENWEATHER_API_KEY&units=metric"
```

When active, you'll see weather data instead of an error.

### Step 2: Enable Multi-Source Mode

Edit `src/services/areaForecastService.ts`:

```typescript
export const WEATHER_CONFIG = {
  useMultiSource: true,  // ← CHANGE THIS TO TRUE
  showConfidence: true,
  fallbackToOpenMeteo: true,
  openWeatherMapApiKey: 'YOUR_OPENWEATHER_API_KEY'
};
```

### Step 3: Restart the App

```bash
# Kill any running processes
pkill -f "expo"

# Restart
npm start
```

## What to Expect

### Before Multi-Source (Current)
- **Single Source**: Open-Meteo only
- **Victoria Harbour**: ~42kt wind (often higher than reality)
- **No confidence indicators**

### After Multi-Source (When Enabled)
- **Dual Sources**: Open-Meteo + OpenWeatherMap consensus
- **Victoria Harbour**: Expected ~15-25kt (closer to Windy/Windfinder)
- **Confidence badges**: Shows reliability percentage
- **Variance indicators**: Yellow/orange borders for uncertain readings

## Visual Changes in App

When multi-source is enabled, you'll see:

1. **Confidence Percentage**: Small green badge showing "75%" on wind readings
2. **Source Attribution**: "Open-Meteo + OpenWeatherMap" in data labels
3. **Low Confidence Warning**: Yellow border when sources disagree significantly
4. **Improved Accuracy**: Readings should align better with Windy.com

## Testing Multi-Source

Once your API key is active:

```bash
# Test the multi-source service
node test-with-openweather.js

# Expected output:
# Open-Meteo: 42.6kt
# OpenWeatherMap: ~15-20kt
# Consensus: ~25kt (weighted average)
```

## Troubleshooting

### API Key Not Working

1. **Check activation time**: Wait 2-3 hours after registration
2. **Verify key**: Log into OpenWeatherMap.org and check key status
3. **Test directly**: Use curl command above

### Multi-Source Not Activating

1. **Check config**: Ensure `useMultiSource: true`
2. **Check logs**: Look for `[MULTI-SOURCE]` in console
3. **Verify fallback**: App should still work with Open-Meteo if OpenWeatherMap fails

### Performance Issues

Multi-source adds ~200-300ms latency. If too slow:
- Keep `fallbackToOpenMeteo: true`
- Consider increasing cache TTL
- Monitor API rate limits (1000/day free tier)

## Current Configuration

```javascript
// Already configured in your app:
WEATHER_CONFIG = {
  useMultiSource: false,        // ← Change to true when ready
  showConfidence: true,         // ✓ Already enabled
  fallbackToOpenMeteo: true,    // ✓ Safety fallback
  openWeatherMapApiKey: '...'   // ✓ Your key is set
}
```

## Next Steps

1. **Wait** for API key activation (check every hour)
2. **Enable** multi-source mode when key is active
3. **Test** consensus readings against Windy/Windfinder
4. **Monitor** accuracy improvements over several days
5. **Adjust** source weights if needed (in multiSourceWeatherService.ts)

## Support

If issues persist after API key activation:
1. Check OpenWeatherMap account status
2. Verify API key hasn't changed
3. Test with curl command to isolate issues
4. Review console logs for `[MULTI-SOURCE]` errors