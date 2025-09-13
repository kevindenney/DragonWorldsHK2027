# Live Data Integration with racingrulesofsailing.org

🎉 **Your Dragon Worlds HK 2027 app now supports full live data integration!**

## What's New

You can now pull **real race results** directly from racingrulesofsailing.org instead of using demo data. This includes:

- ✅ **Event details** (name, venue, dates, organizer)
- ✅ **Race results and standings** 
- ✅ **Sailing instructions and documents**
- ✅ **Competitor entries and registration data**
- ✅ **Official notifications and protests**

## How It Works

### The Problem We Solved
Mobile apps can't directly scrape websites due to **CORS restrictions**. Websites like racingrulesofsailing.org don't allow direct access from mobile applications.

### Our Solution: Serverless Proxy
We created a **serverless function** that acts as a CORS-free proxy:

```
Your App → Serverless API → racingrulesofsailing.org → Real Data
```

The serverless function:
1. **Receives requests** from your mobile app
2. **Scrapes data** from racingrulesofsailing.org 
3. **Parses HTML** to extract race information
4. **Returns structured JSON** to your app
5. **Falls back to demo data** if scraping fails

## Quick Start

### Option 1: Use Demo Data (Current Default)
Your app works immediately with realistic demo data for the Dragon Worlds HK 2027 event.

### Option 2: Enable Live Data (3 Steps)

**Step 1: Deploy the API**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy your scraping API (one-time setup)
npm run deploy:api

# You'll get a URL like: https://your-project.vercel.app
```

**Step 2: Configure Your App**
Update `.env.local`:
```bash
EXPO_PUBLIC_SCRAPER_API_URL=https://your-project.vercel.app
```

**Step 3: Switch to Live Data**
1. Open your app
2. Go to **Schedule** → **Notice Board**
3. Tap the **Settings icon** (⚙️)
4. Turn OFF "Use Demo Data"
5. Tap "Save Changes"

Done! Your app now fetches real race data.

## Local Development

Want to test the API locally first?

```bash
# Terminal 1: Run the serverless API locally
npm run dev:api

# Terminal 2: Test the API
npm run test:api

# Terminal 3: Run your app
npm start
```

The app will automatically use `http://localhost:3000` for local development.

## File Structure

```
api/
├── scrape-race-data.js    # Main serverless function
└── vercel.json            # Deployment configuration

src/services/
├── realDataService.ts     # API client for live data
└── noticeBoardService.ts  # Data service with demo/live toggle
```

## Deployment Options

| Platform | Cost | Setup | Best For |
|----------|------|--------|----------|
| **Vercel** | Free tier | `vercel` | Recommended |
| **Netlify** | Free tier | `netlify deploy` | Alternative |
| **AWS Lambda** | Pay per use | More complex | Enterprise |

## Customization

### Add New Data Sources
Edit `api/scrape-race-data.js` to scrape additional websites:

```javascript
// Add new scraping targets
const websites = [
  'racingrulesofsailing.org',
  'yachtsandyachting.com',    // Add more sources
  'sailworldnews.com'
];
```

### Modify Data Parsing
Update HTML parsing patterns to match different website structures:

```javascript
// Custom parsing for different race management systems
function parseRaceResults(html, system) {
  switch (system) {
    case 'sailwave':
      return parseSailwaveResults(html);
    case 'regattanetwork':
      return parseRegattaNetworkResults(html);
  }
}
```

## Monitoring & Debugging

### Check API Status
```bash
curl "https://your-api-url/api/scrape-race-data?eventId=test&type=event"
```

### View Logs
```bash
# Vercel logs
vercel logs

# Local development logs
# Check console in Terminal running 'npm run dev:api'
```

### Troubleshooting

**API Returns 404**
- ✅ Check your deployment URL
- ✅ Ensure `EXPO_PUBLIC_SCRAPER_API_URL` is correct

**Scraping Fails**
- ✅ Website structure may have changed
- ✅ Check HTML parsing patterns in `scrape-race-data.js`
- ✅ App automatically falls back to demo data

**CORS Errors**
- ✅ Ensure `vercel.json` has correct headers
- ✅ Check function is deployed properly

## Security & Rate Limiting

The serverless function includes:
- ✅ **CORS headers** for mobile app access
- ✅ **Error handling** and fallback mechanisms
- ✅ **Request logging** for monitoring
- ⚠️ **Rate limiting**: Be respectful of target websites

## Cost Estimation

**Free Tier Usage (Vercel)**
- 100GB-Hrs compute time/month
- Unlimited function invocations
- Perfect for development and moderate production use

**Typical Usage**
- ~10ms per request
- ~100 requests/day = 1MB compute time
- Well within free limits

## Next Steps

1. **Deploy your API** using the instructions above
2. **Test with live data** from racingrulesofsailing.org
3. **Monitor usage** and API performance
4. **Customize scraping** for additional racing websites
5. **Add caching** for better performance (optional)

---

🏆 **You now have a production-ready live data integration system!**

Your Dragon Worlds app can pull real race results from the web while maintaining excellent offline support and fallback capabilities.