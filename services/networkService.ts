import { NetworkInfo } from '../types';

/**
 * Fetches public network information (IP, ISP, Location)
 * Robust implementation that tries multiple providers in sequence to ensure 
 * data is returned even if one API is blocked or down.
 */
export const fetchNetworkInfo = async (): Promise<NetworkInfo> => {
  // Strategy: Try multiple providers in order of reliability/detail
  
  // 1. ipapi.co - Very detailed, good free tier, clean JSON
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (!data.error && data.ip) {
        return {
          ip: data.ip,
          isp: data.org || data.asn || 'Unknown Provider',
          location: `${data.city}, ${data.country_name || data.country_code}`,
          type: data.version || 'IPv4'
        };
      }
    }
  } catch (e) {
    // Silent fail for fallback
  }

  // 2. ipwho.is - Good fallback, no key required, CORS friendly
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          ip: data.ip,
          isp: data.connection?.isp || data.connection?.org || data.isp || 'Unknown Provider',
          location: `${data.city}, ${data.country_code}`,
          type: data.type || 'IPv4'
        };
      }
    }
  } catch (e) {
     // Silent fail for fallback
  }

  // 3. ipinfo.io - Fallback (basic info free without auth)
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://ipinfo.io/json', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
          const data = await res.json();
          return {
              ip: data.ip,
              isp: data.org ? data.org.replace(/^AS\d+\s/, '') : 'Unknown', // Remove AS number if present
              location: data.city ? `${data.city}, ${data.country}` : 'Unknown',
              type: 'IPv4'
          }
      }
  } catch(e) {
      // Silent fail
  }

  // Final Fallback if everything fails
  return {
    ip: 'Unknown',
    isp: 'Unknown Provider',
    location: 'Unknown',
    type: 'N/A'
  };
};