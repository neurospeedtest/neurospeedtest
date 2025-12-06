import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Wifi, ArrowDown, ArrowUp, Zap, Globe, MapPin, Server, RefreshCw, AlertTriangle } from 'lucide-react';
import { Gauge } from './components/Gauge';
import { LineGraph } from './components/LineGraph';
import { AnalysisCard } from './components/AnalysisCard';
import { AdBanner } from './components/AdBanner';
import { TestStatus, SpeedTestResult, ChartDataPoint, AnalysisResponse, NetworkInfo } from './types';
import { measurePing, measureDownloadSpeed, simulateUploadSpeed } from './services/speedService';
import { analyzeNetwork } from './services/geminiService';
import { fetchNetworkInfo } from './services/networkService';

const App: React.FC = () => {
  const [status, setStatus] = useState<TestStatus>(TestStatus.IDLE);
  const [result, setResult] = useState<Partial<SpeedTestResult>>({ ping: 0, download: 0, upload: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isRefreshingNetwork, setIsRefreshingNetwork] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [liveSpeed, setLiveSpeed] = useState<number>(0);

  const loadNetworkInfo = useCallback(async () => {
    setIsRefreshingNetwork(true);
    // Reset slightly to show loading state if manual refresh
    if (networkInfo) setNetworkInfo(null);
    
    const info = await fetchNetworkInfo();
    setNetworkInfo(info);
    setIsRefreshingNetwork(false);
  }, []);

  // Fetch IP and ISP info on mount
  useEffect(() => {
    loadNetworkInfo();
  }, [loadNetworkInfo]);

  const startTest = useCallback(async () => {
    setStatus(TestStatus.PING);
    setChartData([]);
    setResult({ ping: 0, download: 0, upload: 0 });
    setAnalysis(null);
    setLiveSpeed(0);
    setErrorMessage(null);

    try {
      // 1. PING (Real)
      let ping;
      try {
        ping = await measurePing();
      } catch (e: any) {
        throw new Error(`Latency Test Failed: ${e.message}`);
      }
      setResult(prev => ({ ...prev, ping }));
      
      // 2. DOWNLOAD (Real)
      setStatus(TestStatus.DOWNLOAD);
      let downloadSpeed;
      try {
        downloadSpeed = await measureDownloadSpeed((speed) => {
          setLiveSpeed(speed);
          setChartData(prev => {
            const newData = [...prev, { time: Date.now(), speed }];
            return newData.slice(-50); 
          });
        });
      } catch (e: any) {
        throw new Error(`Download Test Failed: ${e.message}`);
      }
      
      setResult(prev => ({ ...prev, download: downloadSpeed }));
      setLiveSpeed(0);
      setChartData([]); // Reset chart for next phase

      // 3. UPLOAD (Estimated)
      setStatus(TestStatus.UPLOAD);
      let uploadSpeed;
      try {
        uploadSpeed = await simulateUploadSpeed(downloadSpeed, (speed) => {
          setLiveSpeed(speed);
          setChartData(prev => {
            const newData = [...prev, { time: Date.now(), speed }];
            return newData.slice(-50);
          });
        });
      } catch (e: any) {
        throw new Error(`Upload Simulation Failed: ${e.message}`);
      }

      setResult(prev => ({ ...prev, upload: uploadSpeed }));
      setLiveSpeed(0);

      // 4. AI ANALYZING
      setStatus(TestStatus.ANALYZING);
      const finalResult: SpeedTestResult = {
        ping: ping || 1, // Avoid 0 for analysis context
        download: downloadSpeed,
        upload: uploadSpeed,
        timestamp: Date.now()
      };
      
      try {
        const aiResponse = await analyzeNetwork(finalResult);
        if (aiResponse) {
          setAnalysis(aiResponse);
        }
      } catch (e) {
        console.warn("AI Analysis failed silently", e);
      }
      
      setStatus(TestStatus.COMPLETE);

    } catch (error: any) {
      console.error("Test failed", error);
      setStatus(TestStatus.ERROR);
      setErrorMessage(error.message || "An unexpected network error occurred.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center py-4 sm:py-10 px-3 sm:px-6 font-inter overflow-x-hidden">
      
      {/* Header */}
      <header className="mb-4 text-center space-y-2 w-full max-w-5xl">
        <div className="inline-flex items-center justify-center space-x-2 sm:space-x-3 bg-slate-900/80 px-4 sm:px-5 py-2 rounded-full border border-slate-800 shadow-xl backdrop-blur-md mb-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Neuro<span className="text-cyan-400">Speed</span>
          </h1>
        </div>
        
        {/* AD PLACEMENT: Header */}
        <AdBanner position="header" />
      </header>

      {/* Main Dashboard */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Col: Main Interactive Area */}
        <div className="lg:col-span-2">
          
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] relative overflow-hidden transition-all duration-500">
            
            {/* Background Grid Decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(56, 189, 248, 0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            {/* IDLE STATE */}
            {status === TestStatus.IDLE && (
              <div className="text-center space-y-6 sm:space-y-8 relative z-10 animate-fade-in">
                <div className="relative group cursor-pointer" onClick={startTest}>
                  <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                  <button 
                    className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-slate-900 border-4 border-slate-700 group-hover:border-cyan-400 transition-colors duration-300 flex items-center justify-center shadow-2xl"
                  >
                    <span className="text-2xl sm:text-4xl font-bold text-white group-hover:text-cyan-400 transition-colors">GO</span>
                  </button>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl text-slate-200 font-semibold">Start Speed Test</h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Check your real internet speed</p>
                </div>
              </div>
            )}

            {/* RUNNING STATE */}
            {(status === TestStatus.DOWNLOAD || status === TestStatus.UPLOAD || status === TestStatus.PING) && (
              <div className="flex flex-col items-center w-full relative z-10 animate-fade-in">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800">
                  {status === TestStatus.DOWNLOAD && <ArrowDown className="w-4 h-4 text-cyan-400 animate-bounce" />}
                  {status === TestStatus.UPLOAD && <ArrowUp className="w-4 h-4 text-indigo-400 animate-bounce" />}
                  {status === TestStatus.PING && <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />}
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-300">
                    {status === TestStatus.PING ? "MEASURING LATENCY" : status + "ING..."}
                  </span>
                </div>
                
                <div className="flex justify-center w-full mb-6 sm:mb-8">
                  <Gauge 
                    value={liveSpeed} 
                    label={status === TestStatus.PING ? "Ping ms" : "Mbps"} 
                    max={status === TestStatus.PING ? 100 : 200} 
                    isActive={true}
                    color={status === TestStatus.UPLOAD ? "text-indigo-400" : (status === TestStatus.PING ? "text-emerald-400" : "text-cyan-400")}
                  />
                </div>

                <div className="w-full max-w-md h-24 sm:h-32">
                   <LineGraph 
                    data={chartData} 
                    color={status === TestStatus.UPLOAD ? "#818cf8" : "#22d3ee"} 
                   />
                </div>
              </div>
            )}

            {/* ANALYZING STATE */}
            {status === TestStatus.ANALYZING && (
               <div className="flex flex-col items-center justify-center z-10 text-center animate-fade-in py-8 sm:py-12">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4 sm:mb-6 shadow-lg shadow-cyan-500/10"></div>
                 <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Analyzing Network</h2>
                 <p className="text-sm sm:text-base text-slate-400">Gemini AI is generating performance insights...</p>
               </div>
            )}

            {/* COMPLETE STATE */}
            {status === TestStatus.COMPLETE && (
               <div className="w-full relative z-10 flex flex-col h-full animate-fade-in">
                 <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                      {analysis ? "Analysis Complete" : "Test Complete"}
                    </h2>
                    <button 
                       onClick={startTest}
                       className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded-lg font-medium transition-all border border-slate-700 hover:border-cyan-500/50 text-sm sm:text-base"
                     >
                       <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       <span>Retry</span>
                     </button>
                 </div>
                 
                 {analysis ? (
                   <AnalysisCard analysis={analysis} />
                 ) : (
                   <div className="flex flex-col items-center justify-center flex-grow p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                      <Zap className="w-8 h-8 text-slate-500 mb-3" />
                      <p className="text-slate-400 text-sm">AI Analysis unavailable.</p>
                      <p className="text-slate-500 text-xs">View your raw metrics on the right.</p>
                   </div>
                 )}
               </div>
            )}

            {/* ERROR STATE */}
            {status === TestStatus.ERROR && (
               <div className="flex flex-col items-center justify-center z-10 text-center animate-fade-in px-6 w-full max-w-md">
                 <div className="bg-rose-500/10 rounded-full p-4 mb-4 ring-1 ring-rose-500/20">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Test Failed</h3>
                 <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-4 mb-6 w-full text-left">
                    <p className="text-sm sm:text-base text-rose-200 leading-relaxed font-medium mb-2">
                      {errorMessage || "Unable to complete the speed test due to a network error."}
                    </p>
                    
                    {/* Contextual Help */}
                    <div className="mt-3 pt-3 border-t border-rose-900/30 text-xs text-rose-300/70">
                       <span className="font-semibold uppercase tracking-wider mb-1 block text-[10px]">Suggestion</span>
                       {errorMessage?.includes("Latency") && "Check your internet connection status. You might be offline."}
                       {errorMessage?.includes("Download") && "A firewall or browser extension (like an ad blocker) might be blocking the test traffic."}
                       {errorMessage?.includes("Upload") && "There was an issue estimating upload speed."}
                       {!errorMessage?.includes("Latency") && !errorMessage?.includes("Download") && !errorMessage?.includes("Upload") && "Try refreshing the page or checking your network settings."}
                    </div>
                 </div>
                 <button 
                   onClick={startTest} 
                   className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-lg hover:shadow-rose-900/10"
                 >
                   <RotateCcw className="w-4 h-4" />
                   <span>Try Again</span>
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Right Col: Stats & Info */}
        <div className="flex flex-col gap-4 sm:gap-6">
          
          {/* Metrics Card */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg flex-grow">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">Metrics</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className={`group flex items-center justify-between p-3 sm:p-4 bg-slate-950 rounded-2xl border transition-all duration-300 ${status === TestStatus.PING ? 'border-emerald-500/50 shadow-emerald-900/20 shadow-lg' : 'border-slate-800/50'}`}>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">Ping</span>
                    <span className="text-slate-600 text-[10px] sm:text-xs">Latency</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl sm:text-2xl font-bold font-mono ${result.ping !== undefined && result.ping > 0 ? 'text-white' : 'text-slate-700'}`}>
                    {result.ping}
                  </span>
                  <span className="text-slate-500 text-[10px] sm:text-xs ml-1">ms</span>
                </div>
              </div>

              <div className={`group flex items-center justify-between p-3 sm:p-4 bg-slate-950 rounded-2xl border transition-all duration-300 ${status === TestStatus.DOWNLOAD ? 'border-cyan-500/50 shadow-cyan-900/20 shadow-lg' : 'border-slate-800/50'}`}>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                    <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">Download</span>
                    <span className="text-slate-600 text-[10px] sm:text-xs">Inbound</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl sm:text-2xl font-bold font-mono ${result.download ? 'text-white' : 'text-slate-700'}`}>
                    {result.download ? result.download.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-slate-500 text-[10px] sm:text-xs ml-1">Mbps</span>
                </div>
              </div>

              <div className={`group flex items-center justify-between p-3 sm:p-4 bg-slate-950 rounded-2xl border transition-all duration-300 ${status === TestStatus.UPLOAD ? 'border-indigo-500/50 shadow-indigo-900/20 shadow-lg' : 'border-slate-800/50'}`}>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">Upload</span>
                    <span className="text-slate-600 text-[10px] sm:text-xs">Estimated</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl sm:text-2xl font-bold font-mono ${result.upload ? 'text-white' : 'text-slate-700'}`}>
                    {result.upload ? result.upload.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-slate-500 text-[10px] sm:text-xs ml-1">Mbps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Card */}
          <div className="bg-slate-900/80 rounded-3xl p-5 sm:p-6 border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connection</h4>
              <button 
                onClick={loadNetworkInfo}
                disabled={isRefreshingNetwork}
                className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
                title="Refresh Network Info"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNetwork ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-4">
                {/* ISP Info */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2 text-slate-400 mb-1">
                    <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs uppercase tracking-wide">Provider</span>
                  </div>
                  <span className="text-white font-medium pl-6 truncate text-sm sm:text-base" title={networkInfo?.isp || ""}>
                    {networkInfo?.isp || (isRefreshingNetwork ? "Detecting..." : "Unknown")}
                  </span>
                </div>

                {/* IP Info */}
                <div className="flex flex-col space-y-1">
                   <div className="flex items-center space-x-2 text-slate-400 mb-1">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs uppercase tracking-wide">IP Address</span>
                  </div>
                   <div className="flex items-center justify-between pl-6">
                    <span className="text-white font-mono text-sm sm:text-base">
                      {networkInfo?.ip || (isRefreshingNetwork ? "---.---.---.---" : "Unknown")}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                      {networkInfo?.type || "v4"}
                    </span>
                   </div>
                </div>

                {/* Location Info */}
                <div className="flex flex-col space-y-1">
                   <div className="flex items-center space-x-2 text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs uppercase tracking-wide">Location</span>
                  </div>
                  <span className="text-white text-sm sm:text-base pl-6 truncate">
                     {networkInfo?.location || (isRefreshingNetwork ? "Locating..." : "Unknown")}
                  </span>
                </div>

                <div className="mt-2 pt-4 border-t border-slate-800 text-[10px] text-slate-600 leading-relaxed text-center hidden sm:block">
                    Network data provided by local ISP lookup. Speed test uses multi-source global CDNs.
                </div>
            </div>
          </div>
        </div>

      </main>

      {/* AD PLACEMENT: Footer */}
      <footer className="w-full max-w-5xl mt-6 sm:mt-8 mb-4">
        {/* Styled container for the footer ad */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 sm:p-6 backdrop-blur-sm flex flex-col items-center">
            <AdBanner position="footer" />
        </div>
      </footer>

    </div>
  );
};

export default App;