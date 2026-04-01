/**
 * Utility Provider Lookup Service
 * 
 * This module handles all utility provider searches:
 * 1. Validates user input (zipcode)
 * 2. Looks up location details (state, county) from zipcode
 * 3. Calls Canopy scraper via Vercel API
 * 4. Filters and returns results
 */

/**
 * Zipcode Info Interface - Contains state and county for a given zipcode
 * Values are fetched from zipcodeapi.com or similar service
 */
interface ZipcodeInfo {
  zipcode: string;
  state: string;
  county: string;
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * Provider Interface - Represents a single utility provider
 */
interface UtilityProvider {
  id: string;
  name: string;
  category: 'electric' | 'gas' | 'water' | 'internet' | 'trash' | 'phone';
  website?: string;
  phone?: string;
  serviceArea?: {
    zipcode?: string;
    state?: string;
    county?: string;
  };
}

/**
 * ZIPCODE VALIDATION
 * 
 * Validates if a string is a valid US zipcode format.
 * Accepts:
 *   - 5-digit format: 12345
 *   - 9-digit format: 12345-6789
 *   - Format with space: 12345 6789
 * 
 * Also checks if zipcode is in valid US range (501-99950)
 * 
 * @param zipcode - User input zipcode
 * @returns true if valid format and range, false otherwise
 */
function isValidUSZipcode(zipcode: string): boolean {
  // Regex matches: 5 digits, optionally followed by dash/space and 4 more digits
  const zipRegex = /^\d{5}(?:[-\s]\d{4})?$/;
  
  if (!zipRegex.test(zipcode)) {
    return false;
  }

  // Extract 5-digit prefix and validate it's in US range
  const prefix = parseInt(zipcode.substring(0, 5), 10);
  return prefix >= 501 && prefix <= 99950;
}

/**
 * ZIPCODE API LOOKUP
 * 
 * Calls zipcodeapi.com (or your API endpoint at /api/zipcode/:zipcode)
 * to get location details for a given zipcode.
 * 
 * This populates the state and county fields automatically when
 * a user enters a zipcode, improving UX by pre-filling location info.
 * 
 * @param zipcode - Valid 5-digit zipcode
 * @returns Promise resolving to zipcode info (state, county, city, etc)
 * @throws Error if zipcode not found or API fails
 * 
 * Example:
 *   const info = await lookupZipcodeInfo('31902'); 
 *   console.log(info.state); // 'GA'
 *   console.log(info.county); // 'Houston County'
 */
async function lookupZipcodeInfo(zipcode: string): Promise<ZipcodeInfo> {
  try {
    // First, try your local backend API (if available)
    const res = await fetch(
      `http://localhost:3001/zipcode/${encodeURIComponent(zipcode)}`
    );

    if (res.ok) {
      return res.json();
    }

    // Fallback to public Zipcode API
    const fallbackRes = await fetch(
      `https://www.zipcodeapi.com/rest/info.json/${zipcode}?apikey=${process.env.ZIPCODE_API_KEY || ''}`
    );

    if (!fallbackRes.ok) {
      throw new Error(`Zipcode not found: ${zipcode}`);
    }

    const data = await fallbackRes.json();

    return {
      zipcode,
      state: data.state,
      county: data.county,
      city: data.city,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lng),
    };
  } catch (error) {
    console.error('Zipcode lookup error:', error);
    throw error;
  }
}

/**
 * UTILITY PROVIDER SCRAPER REQUEST
 * 
 * Calls the Vercel API (/api/scrapers/utilities) which uses Canopy
 * to scrape utility providers based on location and category.
 * 
 * The scraper intelligently finds providers serving the given area
 * by querying utility company websites, regulatory databases, and
 * provider directories.
 * 
 * @param zipcode - 5-digit zipcode to search in
 * @param state - 2-letter state code (from zipcode lookup)
 * @param county - County name (from zipcode lookup)
 * @param category - Type of utility (electric, gas, water, etc)
 * @returns Promise of provider array
 * @throws Error if scraper API fails
 * 
 * Example:
 *   const providers = await searchUtilityProviders('31902', 'GA', 'Houston', 'electric');
 *   // Returns: [{ id: '...', name: 'Duke Energy', website: '...' }, ...]
 */
async function searchUtilityProviders(
  zipcode: string,
  state: string,
  county: string,
  category: 'electric' | 'gas' | 'water' | 'internet' | 'trash' | 'phone'
): Promise<UtilityProvider[]> {
  try {
    // Call Vercel serverless function that runs Canopy scraper
    const params = new URLSearchParams({
      zipcode,
      state,
      county,
      category,
    });

    const res = await fetch(`http://localhost:3001/api/scrapers/utilities?${params}`);

    if (!res.ok) {
      throw new Error(`Scraper failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Provider search error:', error);
    throw error;
  }
}

/**
 * MAIN UTILITY LOOKUP FUNCTION
 * 
 * Complete workflow orchestration:
 * 1. Validates zipcode format
 * 2. Looks up state/county from zipcode API
 * 3. Searches for providers via Canopy scraper
 * 
 * This is the primary function called from UI components
 * when users search for utilities in their area.
 * 
 * @param zipcode - User-entered zipcode
 * @param category - Type of utility to search for
 * @returns Promise of LookupResult with status and data
 * 
 * Example:
 *   const result = await lookupUtilityProviders('31902', 'electric');
 *   if (result.success) {
 *     console.log(result.providers); // Array of utilities in that area
 *     console.log(result.location); // { state: 'GA', county: 'Houston' }
 *   } else {
 *     console.error(result.error); // 'Invalid zipcode format'
 *   }
 */
async function lookupUtilityProviders(
  zipcode: string,
  category: 'electric' | 'gas' | 'water' | 'internet' | 'trash' | 'phone'
) {
  // Step 1: Validate zipcode format
  if (!isValidUSZipcode(zipcode)) {
    return {
      success: false,
      error: 'Invalid zipcode format. Use 5 digits (e.g., 31902)',
      providers: [],
      location: null,
    };
  }

  try {
    // Step 2: Look up location details
    const locationInfo = await lookupZipcodeInfo(zipcode);

    // Step 3: Search for providers
    const providers = await searchUtilityProviders(
      zipcode,
      locationInfo.state,
      locationInfo.county,
      category
    );

    return {
      success: true,
      error: null,
      providers,
      location: {
        zipcode: locationInfo.zipcode,
        state: locationInfo.state,
        county: locationInfo.county,
        city: locationInfo.city,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed',
      providers: [],
      location: null,
    };
  }
}

// Export all utilities for use in components
export {
  isValidUSZipcode,
  lookupZipcodeInfo,
  searchUtilityProviders,
  lookupUtilityProviders,
  type ZipcodeInfo,
  type UtilityProvider,
};
