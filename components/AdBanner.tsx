import React, { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  position: 'header' | 'footer';
}

export const AdBanner: React.FC<AdBannerProps> = ({ position }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Prevent double-injection
    const container = bannerRef.current;
    if (!container || container.hasChildNodes()) return;

    const config = position === 'header' 
      ? {
          key: '339df9bbd3e237dc9eff93e0afe5485b',
          width: 728,
          height: 90
        }
      : {
          key: '2f209c137d858a823eb281f2a186d13e',
          width: 300,
          height: 250
        };

    // Create an iframe
    const iframe = document.createElement('iframe');
    iframe.width = `${config.width}`;
    iframe.height = `${config.height}`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.scrolling = 'no';
    iframe.title = "Advertisement";
    
    // CRITICAL FIX: Removed 'sandbox' attribute.
    // Adsterra and similar networks require full context (access to window.top, etc.) 
    // to function correctly. Sandboxing them prevents the ads from showing ("dekayna").

    container.appendChild(iframe);

    // Inject the Adsterra script into the iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html style="margin:0;padding:0;">
        <head>
          <base target="_blank" />
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              background: transparent; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${config.key}',
              'format' : 'iframe',
              'height' : ${config.height},
              'width' : ${config.width},
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/${config.key}/invoke.js"></script>
        </body>
        </html>
      `);
      doc.close();
      
      // Assume loaded after a short delay to remove placeholder
      setTimeout(() => setIsLoaded(true), 1000);
    }
  }, [position]);

  return (
    <div className="flex flex-col items-center justify-center w-full my-2 overflow-hidden z-0">
      <div 
        className={`relative flex justify-center items-center transition-transform origin-center
          ${position === 'header' 
            ? 'scale-[0.45] min-[400px]:scale-[0.55] sm:scale-[0.8] md:scale-100 h-[45px] min-[400px]:h-[55px] sm:h-[75px] md:h-[90px]' 
            : 'scale-90 sm:scale-100 h-[225px] sm:h-[250px]'
          }
        `}
      >
        <div ref={bannerRef} className="flex justify-center items-center">
           {/* Ad iframe is injected here */}
        </div>

        {/* Loading Placeholder */}
        {!isLoaded && (
            <div className="absolute inset-0 bg-slate-800/30 rounded border border-slate-700/30 flex items-center justify-center backdrop-blur-sm">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse font-medium">Loading Ad...</span>
            </div>
        )}
      </div>
      
      <span className="text-[9px] text-slate-700 uppercase tracking-widest mt-1 opacity-60 select-none">
        Sponsored
      </span>
    </div>
  );
};
