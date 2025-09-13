# Live Data Integration Deployment Instructions

This guide explains how to deploy the serverless function to enable full live data integration with racingrulesofsailing.org.

## Option 1: Deploy to Vercel (Recommended)

### Prerequisites
- Install Vercel CLI: `npm i -g vercel`
- Create a Vercel account at [vercel.com](https://vercel.com)

### Deployment Steps

1. **Initialize Vercel Project**
   ```bash
   cd /path/to/your/project
   vercel
   ```

2. **Follow Setup Prompts**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - What's your project's name? `dragon-worlds-scraper`
   - In which directory is your code located? `./`

3. **Set Environment Variables (Optional)**
   ```bash
   # If you want to customize the API behavior
   vercel env add SCRAPER_DEBUG_MODE
   # Value: true (for detailed logging)
   ```

4. **Your API Endpoint**
   After deployment, Vercel will provide a URL like:
   ```
   https://dragon-worlds-scraper-abc123.vercel.app/api/scrape-race-data
   ```

### Configure Your App

Add the API URL to your environment variables:

**.env.local** (create if it doesn't exist):
```bash
EXPO_PUBLIC_SCRAPER_API_URL=https://your-project-name.vercel.app
```

## Option 2: Deploy to Netlify

### Prerequisites
- Install Netlify CLI: `npm install -g netlify-cli`
- Create a Netlify account at [netlify.com](https://netlify.com)

### Deployment Steps

1. **Create netlify/functions directory**
   ```bash
   mkdir -p netlify/functions
   ```

2. **Move the API function**
   ```bash
   cp api/scrape-race-data.js netlify/functions/
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Your API Endpoint**
   ```
   https://your-site-name.netlify.app/.netlify/functions/scrape-race-data
   ```

### Configure Your App

**.env.local**:
```bash
EXPO_PUBLIC_SCRAPER_API_URL=https://your-site-name.netlify.app/.netlify/functions
```

## Option 3: Test Locally

For development and testing:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Run Local Development Server**
   ```bash
   vercel dev
   ```

3. **Your Local API Endpoint**
   ```
   http://localhost:3000/api/scrape-race-data
   ```

### Configure Your App for Local Testing

**.env.local**:
```bash
EXPO_PUBLIC_SCRAPER_API_URL=http://localhost:3000
```

## Testing Your API

Once deployed, test your API:

### Test Event Data
```bash
curl "https://your-api-url/api/scrape-race-data?eventId=dragon-worlds-2027&type=event"
```

### Test Results Data
```bash
curl "https://your-api-url/api/scrape-race-data?eventId=dragon-worlds-2027&type=results"
```

### Expected Response Format
```json
{
  "id": "dragon-worlds-2027",
  "name": "Dragon Worlds Hong Kong 2027",
  "organizer": "Royal Hong Kong Yacht Club",
  "venue": "Hong Kong",
  "dates": {
    "start": "2027-06-15T00:00:00.000Z",
    "end": "2027-06-20T00:00:00.000Z"
  },
  "status": "upcoming",
  "entryCount": 87,
  "documents": [...],
  "_metadata": {
    "scrapedAt": "2024-01-15T10:30:00.000Z",
    "eventId": "dragon-worlds-2027",
    "type": "event",
    "source": "racingrulesofsailing.org"
  }
}
```

## Switching to Live Data in Your App

1. **Deploy your serverless function** (using one of the options above)

2. **Set the API URL** in your app's environment variables

3. **Open your app** and navigate to Notice Board

4. **Tap the Settings icon** (⚙️) in the header

5. **Toggle "Use Demo Data"** to OFF

6. **Tap "Save Changes"**

Your app will now fetch real data from racingrulesofsailing.org through your serverless proxy!

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your `vercel.json` is properly configured
2. **404 Errors**: Check that your function is deployed correctly
3. **Timeout Errors**: The function has a 10-second limit for scraping
4. **Rate Limiting**: Be respectful of the target website

### Debugging

Enable debug mode by setting environment variables:
```bash
vercel env add SCRAPER_DEBUG_MODE true
```

Check your function logs:
```bash
vercel logs
```

### Fallback Behavior

If the API is unavailable, your app will automatically fall back to demo data. Check the console logs for details:
- ✅ = Successfully fetched real data
- ⚠️ = Using fallback data
- 🔄 = Switching to demo data

## Cost Considerations

### Vercel Free Tier
- 100GB-Hrs of compute time per month
- Unlimited function invocations
- Perfect for moderate usage

### Netlify Free Tier
- 125,000 function invocations per month
- 100 hours of function runtime per month

Both are excellent for development and moderate production usage.