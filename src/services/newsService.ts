/**
 * News Service - Dragon World Championships App
 * Fetches and parses news from dragonworld2027.com
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NEWS_URL = 'https://www.dragonworld2027.com/news';
const CACHE_KEY = '@dragonworld_news_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  url?: string;
}

interface CachedNews {
  items: NewsItem[];
  timestamp: number;
}

// In-memory cache for faster access
let memoryCache: CachedNews | null = null;

// Bundled fallback data
export const BUNDLED_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Hopewell Hotel Named Official Hospitality Partner',
    date: '12 January 2026',
    author: 'Virgile Simon Bertrand',
    summary: 'Hopewell Hotel has been designated as the Official Hospitality Partner for the 2027 Hong Kong Dragon World Championship. The organizing committee emphasized this event marks a historic milestone as "the first to be held in Asia," highlighting Hong Kong\'s maritime heritage and tourism potential.',
    url: 'https://www.dragonworld2027.com/news/hopewell-hotel-named-official-hospitality-partner',
  },
  {
    id: '2',
    title: 'Registration Now Open',
    date: '17 December 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Registration for the championship is now available. The event runs from Saturday, November 21 to Sunday, November 29, 2026. It is organized by the Sailing Federation of Hong Kong, China, alongside the Royal Hong Kong Yacht Club, International Dragon Association, and Hong Kong Dragon Association.',
    url: 'https://www.dragonworld2027.com/news/registration-now-open',
  },
  {
    id: '3',
    title: 'Lily Xu Announced as Event Ambassador',
    date: '15 December 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Olympic gold medalist Lily Xu Lijia serves as the official Event Ambassador. Following her celebrated Laser Radial career—including bronze at 2008 Beijing and gold at 2012 London Olympics—she has recently engaged in Dragon sailing, competing across Europe and Hong Kong, including the 2025 Dragon Gold Cup.',
    url: 'https://www.dragonworld2027.com/news/lily-xu-announced-as-event-ambassador',
  },
  {
    id: '4',
    title: 'Karl Kwok Named Event Ambassador',
    date: '7 November 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Mr. Karl Kwok, an accomplished offshore racer, was announced as an event ambassador. His achievements include winning the 1997 Sydney to Hobart Yacht Race and the 2009 Transatlantic Maxi Yacht Cup. He remains "the first Chinese skipper in history" to secure these prestigious international victories.',
    url: 'https://www.dragonworld2027.com/news/karl-kwok-named-event-ambassador',
  },
];

/**
 * Format date from DD/MM/YYYY to "DD Month YYYY"
 */
function formatDate(dateStr: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Try DD/MM/YYYY format (Squarespace default)
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const year = slashMatch[3];
    if (month >= 0 && month < 12) {
      return `${day} ${months[month]} ${year}`;
    }
  }

  // Already in readable format or unknown
  return dateStr;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse news items from HTML using regex patterns
 * Optimized for dragonworld2027.com Squarespace blog structure
 */
function parseNewsHtml(html: string): NewsItem[] {
  const newsItems: NewsItem[] = [];

  try {
    // Match Squarespace blog article containers
    // Pattern: <article class="hentry ... blog-item entry">...</article>
    const articlePattern = /<article[^>]*class="[^"]*blog-item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const articles = html.match(articlePattern);

    if (articles && articles.length > 0) {
      if (__DEV__) {
        console.log(`📰 Found ${articles.length} blog articles`);
      }

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        // Extract URL from article (first /news/ link, usually in blog-title)
        const urlPattern = /href="(\/news\/[^"]+)"/i;
        const urlMatch = article.match(urlPattern);
        const slug = urlMatch ? urlMatch[1].replace('/news/', '') : `article-${i}`;
        const url = urlMatch ? `https://www.dragonworld2027.com${urlMatch[1]}` : undefined;

        // Extract title from <h1 class="blog-title"> or similar
        // Pattern: <h1 class="blog-title"><a href="...">Title</a></h1>
        const titlePattern = /<h[1-6][^>]*class="[^"]*blog-title[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i;
        const titleMatch = article.match(titlePattern);
        let title = titleMatch ? stripHtml(titleMatch[1]) : '';

        // Fallback: try to get title from image alt attribute
        if (!title) {
          const imgAltPattern = /<img[^>]*alt="([^"]+)"[^>]*>/i;
          const imgMatch = article.match(imgAltPattern);
          if (imgMatch && imgMatch[1].length > 10) {
            title = imgMatch[1];
          }
        }

        // Extract author from <span class="blog-author">
        const authorPattern = /<span[^>]*class="[^"]*blog-author[^"]*"[^>]*>([^<]+)<\/span>/i;
        const authorMatch = article.match(authorPattern);
        const author = authorMatch ? authorMatch[1].trim() : 'Virgile Simon Bertrand';

        // Extract date from <time class="blog-date">DD/MM/YYYY</time>
        const datePattern = /<time[^>]*class="[^"]*blog-date[^"]*"[^>]*>([^<]+)<\/time>/i;
        const dateMatch = article.match(datePattern);
        let date = dateMatch ? formatDate(dateMatch[1].trim()) : 'Recent';

        // Extract excerpt from <div class="blog-excerpt-wrapper">
        const excerptPattern = /<div[^>]*class="[^"]*blog-excerpt-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
        const excerptMatch = article.match(excerptPattern);
        let summary = excerptMatch ? stripHtml(excerptMatch[1]) : '';

        // Limit summary length
        if (summary.length > 300) {
          summary = summary.substring(0, 297) + '...';
        }

        // Only add if we have a title
        if (title && title.length > 3) {
          newsItems.push({
            id: slug || String(i + 1),
            title,
            date,
            author,
            summary: summary || `Read more about ${title}`,
            url,
          });

          if (__DEV__) {
            console.log(`📰 Parsed: ${title.substring(0, 50)}...`);
          }
        }
      }
    }

    // Fallback: If no articles found, try to extract from URL patterns
    if (newsItems.length === 0) {
      if (__DEV__) {
        console.log('📰 No articles found, trying URL fallback...');
      }

      // Find all unique /news/ URLs
      const urlPattern = /href="(\/news\/[a-z0-9-]+)"/gi;
      let match;
      const seenUrls = new Set<string>();

      while ((match = urlPattern.exec(html)) !== null) {
        const url = match[1];
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        const slug = url.replace('/news/', '');

        // Try to find title near this URL (in blog-title h1)
        const titleSearchPattern = new RegExp(
          `<h[1-6][^>]*class="[^"]*blog-title[^"]*"[^>]*>[\\s\\S]*?href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]+)<`,
          'i'
        );
        const titleMatch = html.match(titleSearchPattern);
        let title = titleMatch ? titleMatch[1].trim() : '';

        // If no title found, create from slug
        if (!title) {
          title = slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }

        if (title.length > 3 && !title.toLowerCase().includes('read more')) {
          newsItems.push({
            id: slug,
            title,
            date: 'Recent',
            author: 'Virgile Simon Bertrand',
            summary: `Read the full article about ${title}`,
            url: `https://www.dragonworld2027.com${url}`,
          });
        }
      }
    }

  } catch (error) {
    if (__DEV__) {
      console.error('📰 Error parsing news HTML:', error);
    }
  }

  if (__DEV__) {
    console.log(`📰 Total parsed: ${newsItems.length} news items`);
  }

  return newsItems;
}

/**
 * Fetch news from the website
 */
async function fetchNewsFromWebsite(): Promise<NewsItem[]> {
  try {
    if (__DEV__) {
      console.log('📰 Fetching news from website...');
    }

    const response = await fetch(NEWS_URL, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    if (__DEV__) {
      console.log(`📰 Received ${html.length} bytes of HTML`);
    }

    const newsItems = parseNewsHtml(html);

    if (__DEV__) {
      console.log(`📰 Parsed ${newsItems.length} news items`);
    }

    return newsItems;
  } catch (error) {
    if (__DEV__) {
      console.error('📰 Failed to fetch news:', error);
    }
    throw error;
  }
}

/**
 * Save news to AsyncStorage cache
 */
async function saveToCache(items: NewsItem[]): Promise<void> {
  try {
    const cacheData: CachedNews = {
      items,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    memoryCache = cacheData;

    if (__DEV__) {
      console.log('📰 News cached successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('📰 Failed to cache news:', error);
    }
  }
}

/**
 * Load news from AsyncStorage cache
 */
async function loadFromCache(): Promise<NewsItem[] | null> {
  try {
    // Check memory cache first
    if (memoryCache && (Date.now() - memoryCache.timestamp) < CACHE_TTL) {
      if (__DEV__) {
        console.log('📰 Using memory-cached news');
      }
      return memoryCache.items;
    }

    // Check AsyncStorage
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const cacheData: CachedNews = JSON.parse(cached);
      const isFresh = (Date.now() - cacheData.timestamp) < CACHE_TTL;

      memoryCache = cacheData;

      if (isFresh) {
        if (__DEV__) {
          console.log('📰 Using disk-cached news');
        }
        return cacheData.items;
      } else {
        if (__DEV__) {
          console.log('📰 Cache is stale, will refetch');
        }
        // Return stale data but don't block - caller should refetch
        return cacheData.items;
      }
    }

    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('📰 Failed to load cached news:', error);
    }
    return null;
  }
}

/**
 * Check if cache is fresh (within TTL)
 */
async function isCacheFresh(): Promise<boolean> {
  if (memoryCache) {
    return (Date.now() - memoryCache.timestamp) < CACHE_TTL;
  }

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const cacheData: CachedNews = JSON.parse(cached);
      return (Date.now() - cacheData.timestamp) < CACHE_TTL;
    }
  } catch (error) {
    // Ignore cache read errors
  }

  return false;
}

/**
 * Main function to fetch news with caching and fallback
 */
export async function fetchNews(forceRefresh = false): Promise<NewsItem[]> {
  try {
    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cached = await loadFromCache();
      const fresh = await isCacheFresh();

      if (cached && cached.length > 0 && fresh) {
        return cached;
      }
    }

    // Fetch fresh data from website
    const freshNews = await fetchNewsFromWebsite();

    if (freshNews.length > 0) {
      await saveToCache(freshNews);
      return freshNews;
    }

    // If fetch returned empty, try to return cached data
    const cached = await loadFromCache();
    if (cached && cached.length > 0) {
      return cached;
    }

    // Fall back to bundled data
    if (__DEV__) {
      console.log('📰 Using bundled news as fallback');
    }
    return BUNDLED_NEWS;

  } catch (error) {
    if (__DEV__) {
      console.error('📰 Error fetching news, using fallback:', error);
    }

    // Try to return cached data on error
    const cached = await loadFromCache();
    if (cached && cached.length > 0) {
      return cached;
    }

    // Return bundled data as last resort
    return BUNDLED_NEWS;
  }
}

/**
 * Clear the news cache
 */
export async function clearNewsCache(): Promise<void> {
  try {
    memoryCache = null;
    await AsyncStorage.removeItem(CACHE_KEY);
    if (__DEV__) {
      console.log('📰 News cache cleared');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('📰 Failed to clear news cache:', error);
    }
  }
}

/**
 * Get cache status for debugging
 */
export async function getNewsCacheStatus(): Promise<{
  hasCachedData: boolean;
  isFresh: boolean;
  itemCount: number;
  lastUpdated: Date | null;
}> {
  let hasCachedData = false;
  let isFresh = false;
  let itemCount = 0;
  let lastUpdated: Date | null = null;

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const cacheData: CachedNews = JSON.parse(cached);
      hasCachedData = true;
      itemCount = cacheData.items.length;
      lastUpdated = new Date(cacheData.timestamp);
      isFresh = (Date.now() - cacheData.timestamp) < CACHE_TTL;
    }
  } catch (error) {
    // Ignore cache read errors
  }

  return { hasCachedData, isFresh, itemCount, lastUpdated };
}

// Export the service as a singleton object
export const newsService = {
  fetchNews,
  clearCache: clearNewsCache,
  getCacheStatus: getNewsCacheStatus,
  BUNDLED_NEWS,
};

export default newsService;
