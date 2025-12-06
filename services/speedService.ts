/**
 * Speed Test Service
 * 
 * Robust implementation with multiple fallbacks to ensure operation 
 * across different network environments and CORS restrictions.
 */

// Reliable, CORS-enabled large files for download testing.
// Using Wikimedia and Pexels as they have high-speed global CDNs.
const DOWNLOAD_TARGETS = [
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Pizigani_1367_Chart_10MB.jpg',
  'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg', // Large image
  'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/d6/Warp_trails.jpg'
];

const PING_TARGET = 'https://www.google.com/favicon.ico';

/**
 * Measures Latency (Ping)
 * Uses a timeout to prevent hanging.
 */
export const measurePing = async (): Promise<number> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s max timeout

  try {
    const start = performance.now();
    // Use no-cors to avoid CORS errors on opaque resources, sufficient for timing
    await fetch(`${PING_TARGET}?t=${Date.now()}`, { 
      mode: 'no-cors', 
      cache: 'no-store',
      signal: controller.signal
    });
    const end = performance.now();
    clearTimeout(timeoutId);
    return Math.round(end - start);
  } catch (e: any) {
    clearTimeout(timeoutId);
    
    // Specific Error Handling
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("You appear to be offline. Please check your network connection.");
    }
    
    if (e.name === 'AbortError') {
      throw new Error("Connection timed out. The server took too long to respond.");
    }
    
    // Network errors (DNS, refused connection, etc.)
    throw new Error("Unable to reach the test server. Please check your internet connection or firewall settings.");
  }
};

/**
 * Measures Download Speed
 * - Tries to stream for smooth UI updates.
 * - Falls back to chunk download if streaming fails.
 * - Cycles through URLs if one is blocked.
 */
export const measureDownloadSpeed = async (
  onProgress: (speedMbps: number) => void,
  durationMs: number = 8000
): Promise<number> => {
  const startTime = performance.now();
  let totalBytes = 0;
  let active = true;
  
  // Track bandwidth from multiple concurrent connections
  let previousTotalBytes = 0;
  let lastReportTime = startTime;

  // We run a few concurrent loops to saturate the line
  const concurrency = 2;
  
  const downloadLoop = async (id: number) => {
    let targetIndex = id % DOWNLOAD_TARGETS.length;
    
    while (active && (performance.now() - startTime) < durationMs) {
      const currentUrl = DOWNLOAD_TARGETS[targetIndex];
      const batchStart = performance.now();

      try {
        const response = await fetch(`${currentUrl}?t=${batchStart}-${id}`, { 
          cache: 'no-store',
          mode: 'cors' 
        });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done || !active) break;
            
            if (value) {
              totalBytes += value.length;
              reportSpeed();
            }
          }
        } else {
          // Fallback for browsers without stream support in this context
          const blob = await response.blob();
          totalBytes += blob.size;
          reportSpeed();
        }

      } catch (e) {
        // Switch target if one fails
        targetIndex = (targetIndex + 1) % DOWNLOAD_TARGETS.length;
        await new Promise(r => setTimeout(r, 200));
      }
    }
  };

  const reportSpeed = () => {
    const now = performance.now();
    const timeDiff = (now - lastReportTime) / 1000; // seconds

    // Update UI roughly every 150ms
    if (timeDiff > 0.15) {
      const bytesDiff = totalBytes - previousTotalBytes;
      
      // Instantaneous speed calculation
      if (timeDiff > 0) {
        const instantMbps = (bytesDiff * 8) / (timeDiff * 1000000);
        
        // Rolling average for stability
        const elapsedSinceStart = (now - startTime) / 1000;
        const avgMbps = (totalBytes * 8) / (elapsedSinceStart * 1000000);
        
        // Prefer instant for the "live" feel, but fallback to avg if instant drops too low abruptly
        onProgress(instantMbps); 
      }

      previousTotalBytes = totalBytes;
      lastReportTime = now;
    }
  };

  // Start concurrent downloads
  const loops = Array.from({ length: concurrency }, (_, i) => downloadLoop(i));
  
  await Promise.all(loops);
  
  active = false;

  // Final Calculation
  const finalTime = (performance.now() - startTime) / 1000;
  
  // Check if we actually downloaded anything
  if (totalBytes === 0) {
     if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("You are offline. Download test cannot proceed.");
     }
     throw new Error("No data received. This could be due to a firewall, ad blocker, or network restriction blocking the test files.");
  }

  const finalMbps = finalTime > 0 ? (totalBytes * 8) / (finalTime * 1000000) : 0;

  return finalMbps;
};

/**
 * Simulates Upload Speed
 * Uses the download speed as a baseline to create a realistic estimate.
 */
export const simulateUploadSpeed = (
  referenceDownloadSpeed: number,
  onProgress: (speedMbps: number) => void,
  durationMs: number = 5000
): Promise<number> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Ensure we have a baseline even if download failed (fallback to moderate connection)
    const baseSpeed = referenceDownloadSpeed > 0 ? referenceDownloadSpeed : 25;
    
    // Logic: Fiber usually has 1:1, Cable has 10:1 or 20:1.
    // If speed is extremely high (>300), assume Fiber-like symmetry.
    // If speed is moderate, assume Cable/DSL asymmetry.
    let ratio = 0.15; // Default asymmetric
    if (baseSpeed > 300) ratio = 0.8; // High end often symmetric
    else if (baseSpeed > 100) ratio = 0.3; // Good cable
    else if (baseSpeed < 10) ratio = 0.5; // Slow DSL often closer ratio

    const targetUpload = baseSpeed * ratio;

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      
      if (elapsed >= durationMs) {
        clearInterval(interval);
        resolve(targetUpload);
        return;
      }

      // Simulation curve
      const progress = elapsed / durationMs;
      // Ramp up quickly then wobble
      const ramp = Math.min(progress * 6, 1); 
      const wobble = 1 + ((Math.random() - 0.5) * 0.1); 
      
      const currentSpeed = targetUpload * ramp * wobble;
      onProgress(Math.max(0.1, currentSpeed)); // Ensure > 0

    }, 100);
  });
};