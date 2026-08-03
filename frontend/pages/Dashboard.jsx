/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaHardHat,
    FaUserFriends,
    FaExclamationTriangle,
    FaClipboardList,
    FaUpload,
    FaChartLine,
    FaFilePdf,
    FaPlayCircle,
    FaSignOutAlt,
    FaTrash,
    FaBox
} from "react-icons/fa";
import { useVideo } from "../context/VideoContext";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Live Tracking");
    const [uploading, setUploading] = useState(false);
    
    // We now use Cloudinary video URL instead of live stream refs
    const { videoData, setVideoData, statsData, setStatsData, incidentsData, setIncidentsData, clearVideo } = useVideo();
    const { user, logout } = useAuth();
    const isAdmin = user?.role === "admin";

    const statistics = [
        {
            title: "Max Workers Detected",
            value: statsData.workers,
            icon: <FaUserFriends size={28} />,
            color: "text-blue-500",
            bg: "bg-blue-500/10 dark:bg-blue-500/20"
        },
        {
            title: "Helmet Compliance",
            value: `${statsData.compliance_score}%`,
            icon: <FaHardHat size={28} />,
            color: "text-green-500",
            bg: "bg-green-500/10 dark:bg-green-500/20"
        },
        {
            title: "Incidents Detected",
            value: statsData.total_incidents,
            icon: <FaExclamationTriangle size={28} />,
            color: "text-red-500",
            bg: "bg-red-500/10 dark:bg-red-500/20"
        },
        {
            title: "Compliance Score",
            value: `${statsData.compliance_score}%`,
            icon: <FaClipboardList size={28} />,
            color: "text-purple-500",
            bg: "bg-purple-500/10 dark:bg-purple-500/20"
        },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            let apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            apiUrl = apiUrl.replace(/\/+$/, '');
            const response = await fetch(`${apiUrl}/api/video/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            
            const result = await response.json();
            const doc = result.data;
            
            // Set Cloudinary URL for the video player
            setVideoData({ url: doc.processed_video_url });
            
            // Set stats from batch detection summary
            setStatsData({
                workers: doc.detection_summary.max_workers,
                compliance_score: doc.detection_summary.compliance_score,
                total_incidents: doc.detection_summary.total_incidents
            });
            
            // Map raw incident frames to unique readable rows
            const formattedIncidents = (doc.detection_summary.incidents_list || []).map((inc, index) => ({
                id: index + 1,
                type: inc.type,
                location: `Frame ${inc.frame}`,
                status: "Pending"
            }));
            
            setIncidentsData(formattedIncidents);
            
        } catch (error) {
            alert("Error processing video: " + error.message);
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input so the same file can be uploaded again
        }
    };

    const navItems = [
        { name: "Live Tracking", icon: <FaPlayCircle />, path: "/dashboard" },
        { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
        { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
        { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
        { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
        { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
        { name: "Stocks", icon: <FaBox />, path: "/stocks" },
    ];

    return (
        <div className="min-h-screen w-full flex bg-[#F5F5F7] dark:bg-[#09090b] transition-colors duration-300" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            
            {/* Sidebar (macOS frosted glass style) */}
            <aside className="w-64 bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/5 flex flex-col hidden md:flex sticky top-0 h-screen shadow-[4px_0_24px_rgb(0,0,0,0.02)] transition-colors duration-300">
                <div className="p-6 flex items-center gap-3 border-b border-gray-200/50 dark:border-white/5">
                    <div className="bg-gradient-to-br from-[#1d1d1f] to-[#434345] dark:from-white dark:to-gray-300 p-2.5 rounded-xl shadow-lg">
                        <FaHardHat size={20} className="text-[#E8A33D] dark:text-[#E8A33D]" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">SiteWatch AI</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 mt-2 px-3">Main Menu</div>
                    {navItems.filter(item => isAdmin || !["Workers", "Analytics", "Reports"].includes(item.name)).map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                activeTab === item.name 
                                ? "bg-[#0066CC] dark:bg-[#E8A33D] text-white dark:text-black shadow-md shadow-[#0066CC]/20 dark:shadow-[#E8A33D]/20" 
                                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            <span className={activeTab === item.name ? "opacity-100" : "opacity-70"}>{item.icon}</span>
                            {item.name}
                        </Link>
                    ))}
                </nav>
                
                <div className="p-4 mt-auto">
                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-sm transition-all"
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
                
                <div className="p-4 border-t border-gray-200/50 dark:border-white/5">
                    <div className="bg-gradient-to-r from-[#E8A33D]/10 to-transparent p-4 rounded-2xl border border-[#E8A33D]/20">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                            <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white">System Active</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-1">AI models running optimally</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                
                {/* Subtle background orbs */}
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 dark:bg-[#E8A33D]/5 blur-[100px] pointer-events-none" />
                
                {/* Topbar */}
                <header className="h-20 bg-white/40 dark:bg-[#18181b]/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{activeTab}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Monitor your construction site safety</p>
                    </div>
                    
                    {isAdmin && (
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
                            <input 
                                type="text" 
                                placeholder="Enter Video URL..." 
                                className="px-4 py-2 text-sm bg-transparent outline-none w-48 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                                id="video-url-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        setVideoData({ url: e.target.value });
                                    }
                                }}
                            />
                            <button 
                                className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                onClick={() => {
                                    const input = document.getElementById('video-url-input');
                                    if (input && input.value) {
                                        setVideoData({ url: input.value });
                                    }
                                }}
                            >
                                Play
                            </button>
                        </div>
                        {videoData && (
                            <button 
                                onClick={clearVideo}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md flex items-center gap-2 active:scale-95"
                            >
                                <FaTrash /> Remove Video
                            </button>
                        )}
                        <label className="cursor-pointer bg-[#1d1d1f] dark:bg-white dark:text-black hover:bg-[#333336] dark:hover:bg-gray-200 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md flex items-center gap-2 active:scale-95">
                            {uploading ? "Analyzing Video (May take a minute)..." : <><FaUpload /> Upload & Analyze</>}
                            <input type="file" className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                    )}
                </header>

                {/* Dashboard Content */}
                <div className="p-8 overflow-y-auto flex-1 z-0 space-y-8">
                    
                    {/* Live Tracking / Video Section */}
                    {activeTab === "Live Tracking" && (
                        <div className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-xl rounded-[2rem] p-1 border border-white dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-colors duration-300">
                            <div className="bg-[#1d1d1f] dark:bg-black rounded-[1.8rem] aspect-video w-full flex flex-col items-center justify-center relative overflow-hidden group">
                                {videoData ? (
                                    <>
                                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                                            <span className="text-xs text-white font-medium tracking-wide uppercase">AI Processed</span>
                                        </div>
                                        <video 
                                            src={videoData.url} 
                                            controls 
                                            autoPlay 
                                            loop 
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            <FaUpload size={32} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-xl text-white font-medium tracking-tight mb-2">
                                            {uploading ? "Processing video..." : "No Video Source"}
                                        </h3>
                                        <p className="text-gray-400 text-sm max-w-sm">
                                            {uploading 
                                                ? "Our AI is currently running YOLO object detection on the uploaded video. This may take a moment."
                                                : "Upload a construction site video using the button in the top right to begin AI safety analysis."
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Statistics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statistics.map((stat, i) => (
                            <div key={i} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-tight">{stat.title}</p>
                                        <h3 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mt-2 tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                        {stat.icon}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Incidents Table */}
                    <div className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-xl rounded-[1.5rem] border border-white dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden transition-colors duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Recent Incidents</h2>
                            <button className="text-sm font-medium text-[#0066CC] dark:text-[#E8A33D] hover:text-[#0055AA] dark:hover:text-[#c98d34] transition-colors">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Violation Type</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {incidentsData.length > 0 ? incidentsData.slice(0, 10).map((incident) => (
                                        <tr key={incident.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-8 text-sm font-medium text-gray-900 dark:text-gray-200">#{incident.id}</td>
                                            <td className="py-4 px-8 text-sm text-gray-600 dark:text-gray-400">{incident.type}</td>
                                            <td className="py-4 px-8 text-sm text-gray-600 dark:text-gray-400">{incident.location}</td>
                                            <td className="py-4 px-8 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    incident.status === 'Resolved' 
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20'
                                                }`}>
                                                    {incident.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No incidents detected yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Dashboard;
