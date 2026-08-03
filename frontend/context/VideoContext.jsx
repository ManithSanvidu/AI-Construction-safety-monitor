import React, { createContext, useContext, useState } from "react";

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const [videoData, setVideoData] = useState(null);
    const [statsData, setStatsData] = useState({ workers: 0, compliance_score: 100, total_incidents: 0 });
    const [incidentsData, setIncidentsData] = useState([]);
    
    const clearVideo = () => {
        setVideoData(null);
        setStatsData({ workers: 0, compliance_score: 100, total_incidents: 0 });
        setIncidentsData([]);
    };

    return (
        <VideoContext.Provider value={{ 
            videoData, setVideoData, 
            statsData, setStatsData,
            incidentsData, setIncidentsData,
            clearVideo 
        }}>
            {children}
        </VideoContext.Provider>
    );
};
