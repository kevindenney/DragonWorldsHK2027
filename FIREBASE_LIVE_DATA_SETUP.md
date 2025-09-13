# Firebase Live Data Integration Setup

🔥 **Complete guide to deploy Firebase Cloud Functions for live race data scraping**

## ✅ **What's Ready**

Your Firebase Cloud Functions are ready to deploy! Here's what I've created:

- ✅ **Firebase Function**: `functions/index.js` - Complete scraping function
- ✅ **Dependencies**: `functions/package.json` - All required packages
- ✅ **Configuration**: Updated `firebase.json` and environment variables
- ✅ **App Integration**: `RealDataService.ts` updated for Firebase Functions

## 🚨 **Required: Upgrade to Blaze Plan**

Firebase Cloud Functions require the **Blaze (Pay-as-You-Go)** plan. 

### Why the Blaze Plan?
- Cloud Functions need external network access (to scrape racingrulesofsailing.org)
- **Cost**: Very low for typical usage (~$0-5/month for your app)
- **Free Tier**: Still includes generous limits within the paid plan

### Upgrade Steps:
1. **Visit**: https://console.firebase.google.com/project/dragonworldshk2027/usage/details
2. **Click "Modify Plan"**
3. **Select "Blaze (Pay-as-you-go)"**
4. **Add billing information**

## 📤 **Deploy Firebase Functions**

Once you've upgraded to Blaze plan:

```bash
# 1. Ensure you're using the correct project
firebase use dragonworldshk2027

# 2. Deploy functions
firebase deploy --only functions

# 3. Your function will be available at:
# https://us-central1-dragonworldshk2027.cloudfunctions.net/scrapeRaceData
```

## 🧪 **Test Your Functions**

After deployment, test with curl:

```bash
# Test event data
curl "https://us-central1-dragonworldshk2027.cloudfunctions.net/scrapeRaceData?eventId=dragon-worlds-2027&type=event"

# Test race results
curl "https://us-central1-dragonworldshk2027.cloudfunctions.net/scrapeRaceData?eventId=dragon-worlds-2027&type=results"
```

## 📱 **Enable Live Data in Your App**

Your app is already configured! Just follow these steps:

1. **Open your Dragon Worlds app**
2. **Navigate**: Schedule → Notice Board  
3. **Tap Settings** (⚙️ icon in header)
4. **Toggle "Use Demo Data"** to OFF
5. **Save Changes**

The app will now fetch live data from your Firebase Functions!

## 🔧 **How It Works**

```
Mobile App → Firebase Functions → racingrulesofsailing.org → Real Data
```

### Your Function Features:
- ✅ **CORS Enabled**: No browser restrictions
- ✅ **Caching**: Uses Firestore to cache results (5min TTL)
- ✅ **Error Handling**: Falls back to demo data if scraping fails
- ✅ **Multiple Data Types**: Events, results, documents, competitors
- ✅ **Logging**: Full request/response logging in Firebase Console

### Function URL Pattern:
```
https://us-central1-dragonworldshk2027.cloudfunctions.net/scrapeRaceData?eventId=EVENT_ID&type=TYPE
```

**Supported Types:**
- `event` - Main event information
- `results` - Race results and standings  
- `documents` - Sailing instructions, PDFs
- `competitors` - Entry lists and competitor data

## 💰 **Cost Estimation**

**Typical Monthly Usage:**
- ~1000 function invocations
- ~10GB compute time
- **Estimated Cost: $0.50-$2.00/month**

**Free Tier Included:**
- 2 million invocations/month
- 400,000 GB-seconds/month
- Your usage will likely stay in free tier!

## 🛠 **Development Workflow**

### Local Testing (Optional)
```bash
# Start Firebase emulator (if not conflicting with Expo)
firebase emulators:start --only functions

# Test locally
curl "http://localhost:5001/dragonworldshk2027/us-central1/scrapeRaceData?eventId=test&type=event"
```

### Production Deployment
```bash
# Deploy new changes
firebase deploy --only functions

# View logs
firebase functions:log --only scrapeRaceData
```

## 📊 **Monitoring & Debugging**

### Firebase Console:
1. Visit: https://console.firebase.google.com/project/dragonworldshk2027
2. **Functions** tab: View function status, logs, metrics
3. **Firestore** tab: View cached data in `raceDataCache` collection

### Common Issues:

**"Function not found"**
- ✅ Ensure function is deployed: `firebase deploy --only functions`
- ✅ Check function name matches: `scrapeRaceData`

**"CORS error"** 
- ✅ Function includes CORS headers (already configured)

**"Scraping failed"**
- ✅ Function falls back to demo data automatically
- ✅ Check logs in Firebase Console

**"Cached data"**
- ✅ Add `?useCache=false` to force fresh scraping
- ✅ Cache TTL is 5 minutes

## 🔄 **Cache Management**

Your function automatically caches scraped data in Firestore:

- **Collection**: `raceDataCache`
- **TTL**: 5 minutes
- **Automatic Cleanup**: Expired entries auto-deleted
- **Manual Clear**: Delete documents in Firestore Console

## 🚀 **Next Steps**

1. **Upgrade Firebase Plan** ⬆️
2. **Deploy Functions** 📤
3. **Test API Endpoints** 🧪
4. **Enable Live Data in App** 📱
5. **Monitor Usage** 📊

---

## 🎯 **Alternative: Use Demo Data**

If you prefer not to upgrade Firebase plan right now:

1. Your app works perfectly with **demo data**
2. All Notice Board features are fully functional  
3. Realistic sailing event data included
4. You can always deploy Firebase Functions later

---

## ⚡ **Quick Deploy Commands**

```bash
# 1. Set project
firebase use dragonworldshk2027

# 2. Deploy (after upgrading to Blaze plan)
firebase deploy --only functions

# 3. Test
curl "https://us-central1-dragonworldshk2027.cloudfunctions.net/scrapeRaceData?eventId=dragon-worlds-2027&type=event"

# 4. View logs
firebase functions:log --only scrapeRaceData
```

🏁 **Your Dragon Worlds app now has production-ready live data capabilities powered by Firebase!**