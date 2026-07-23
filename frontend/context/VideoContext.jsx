import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const [videoData, setVideoData] = useState(null);
    const [statsData, setStatsData] = useState({ workers: 0, compliance_score: 100, total_incidents: 0 });
    const [incidentsData, setIncidentsData] = useState([]);
    const [history, setHistory] = useState([]);
    
    const imgRef = useRef(null);
    const hiddenContainerRef = useRef(null);

    // Polling logic for global stats
    useEffect(() => {
        let interval;
        let isActive = true;
        if (videoData) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/incidents`);
                    if (res.ok && isActive) {
                        const data = await res.json();
                        setStatsData({
                            workers: data.workers,
                            compliance_score: data.compliance_score,
                            total_incidents: data.total_incidents
                        });
                        setIncidentsData(data.incidents || []);
                        
                        setHistory(prev => {
                            const newHistory = [...prev, { 
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                                compliance: data.compliance_score 
                            }];
                            if (newHistory.length > 20) newHistory.shift();
                            return newHistory;
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch incidents:", e);
                }
            }, 1000);
        }
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [videoData]);

    const streamUrl = videoData 
        ? (videoData.url 
            ? `${import.meta.env.VITE_API_BASE_URL}/video/stream?url=${encodeURIComponent(videoData.url)}&t=${videoData.timestamp}`
            : `${import.meta.env.VITE_API_BASE_URL}/video/stream/${videoData.filename}?t=${videoData.timestamp}`)
        : null;

    const clearVideo = () => {
        setVideoData(null);
        setStatsData({ workers: 0, compliance_score: 100, total_incidents: 0 });
        setIncidentsData([]);
        setHistory([]);
    };

    return (
        <VideoContext.Provider value={{ 
            videoData, setVideoData, 
            statsData, incidentsData, history,
            imgRef, hiddenContainerRef, clearVideo 
        }}>
            <div ref={hiddenContainerRef} style={{ display: 'none' }}>
                <img 
                    ref={imgRef}
                    src={streamUrl || ""} 
                    alt="Background AI Stream" 
                />
            </div>
            {children}
        </VideoContext.Provider>
    );
};
