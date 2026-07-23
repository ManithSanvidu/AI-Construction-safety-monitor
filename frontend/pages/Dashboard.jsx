/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
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
    FaTrash
} from "react-icons/fa";
import { useVideo } from "../context/VideoContext";

function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Live Tracking");
    const [uploading, setUploading] = useState(false);
    const { videoData, setVideoData, statsData, incidentsData, imgRef, hiddenContainerRef, clearVideo } = useVideo();
    const dashboardContainerRef = useRef(null);

    useEffect(() => {
        if (dashboardContainerRef.current && imgRef.current) {
            dashboardContainerRef.current.appendChild(imgRef.current);
            imgRef.current.style.display = 'block';
            imgRef.current.className = 'w-full h-full object-contain';
        }
        return () => {
            if (hiddenContainerRef.current && imgRef.current) {
                hiddenContainerRef.current.appendChild(imgRef.current);
                imgRef.current.style.display = 'none';
            }
        };
    }, [videoData, imgRef, hiddenContainerRef]);

    const statistics = [
        {
            title: "Workers Detected",
            value: statsData.workers,
            icon: <FaUserFriends size={28} />,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Helmet Compliance",
            value: `${statsData.compliance_score}%`,
            icon: <FaHardHat size={28} />,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Incidents Today",
            value: statsData.total_incidents,
            icon: <FaExclamationTriangle size={28} />,
            color: "text-red-500",
            bg: "bg-red-500/10"
        },
        {
            title: "Compliance Score",
            value: `${statsData.compliance_score}%`,
            icon: <FaClipboardList size={28} />,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ];

    const handleLogout = () => {
        // Here you would also clear any authentication tokens if implemented
        navigate("/login");
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            
            const data = await response.json();
            setVideoData({ filename: data.filename, timestamp: Date.now() });
        } catch (error) {
            alert("Error uploading video: " + error.message);
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
    ];

    return (
        <div className="min-h-screen w-full flex bg-[#F5F5F7]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            
            {/* Sidebar (macOS frosted glass style) */}
            <aside className="w-64 bg-white/60 backdrop-blur-2xl border-r border-gray-200/50 flex flex-col hidden md:flex sticky top-0 h-screen shadow-[4px_0_24px_rgb(0,0,0,0.02)]">
                <div className="p-6 flex items-center gap-3 border-b border-gray-200/50">
                    <div className="bg-gradient-to-br from-[#1d1d1f] to-[#434345] p-2.5 rounded-xl shadow-lg">
                        <FaHardHat size={20} className="text-[#E8A33D]" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-[#1d1d1f]">SiteWatch AI</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 mt-2 px-3">Main Menu</div>
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                activeTab === item.name 
                                ? "bg-[#0066CC] text-white shadow-md shadow-[#0066CC]/20" 
                                : "text-gray-600 hover:bg-black/5 hover:text-gray-900"
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-sm transition-all"
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
                
                <div className="p-4 border-t border-gray-200/50">
                    <div className="bg-gradient-to-r from-[#E8A33D]/10 to-transparent p-4 rounded-2xl border border-[#E8A33D]/20">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                            <span className="text-xs font-semibold text-[#1d1d1f]">System Active</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">AI models running optimally</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                
                {/* Subtle background orbs */}
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
                
                {/* Topbar */}
                <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{activeTab}</h1>
                        <p className="text-sm text-gray-500 font-medium">Monitor your construction site safety</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <input 
                                type="text" 
                                placeholder="Enter Video URL..." 
                                className="px-4 py-2 text-sm bg-transparent outline-none w-48 text-gray-700 placeholder-gray-400"
                                id="video-url-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        setVideoData({ url: e.target.value, timestamp: Date.now() });
                                    }
                                }}
                            />
                            <button 
                                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                                onClick={() => {
                                    const input = document.getElementById('video-url-input');
                                    if (input && input.value) {
                                        setVideoData({ url: input.value, timestamp: Date.now() });
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
                        <label className="cursor-pointer bg-[#1d1d1f] hover:bg-[#333336] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md flex items-center gap-2 active:scale-95">
                            {uploading ? "Uploading..." : <><FaUpload /> Upload Video</>}
                            <input type="file" className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 overflow-y-auto flex-1 z-0 space-y-8">
                    
                    {/* Live Tracking / Video Section */}
                    {activeTab === "Live Tracking" && (
                        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-1 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="bg-[#1d1d1f] rounded-[1.8rem] aspect-video w-full flex flex-col items-center justify-center relative overflow-hidden group">
                                {videoData ? (
                                    <>
                                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                                            <span className="text-xs text-white font-medium tracking-wide uppercase">AI Live Analysis</span>
                                        </div>
                                        <div ref={dashboardContainerRef} className="w-full h-full object-contain" />
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                            <FaUpload size={32} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-xl text-white font-medium tracking-tight mb-2">No Video Source</h3>
                                        <p className="text-gray-400 text-sm max-w-sm">Upload a construction site video using the button in the top right to begin real-time AI safety analysis.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Statistics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statistics.map((stat, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 tracking-tight">{stat.title}</p>
                                        <h3 className="text-3xl font-bold text-[#1d1d1f] mt-2 tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                        {stat.icon}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Incidents Table */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Recent Incidents</h2>
                            <button className="text-sm font-medium text-[#0066CC] hover:text-[#0055AA] transition-colors">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Violation Type</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {incidentsData.length > 0 ? incidentsData.map((incident) => (
                                        <tr key={incident.id} className="hover:bg-white/50 transition-colors">
                                            <td className="py-4 px-8 text-sm font-medium text-gray-900">#{incident.id}</td>
                                            <td className="py-4 px-8 text-sm text-gray-600">{incident.type}</td>
                                            <td className="py-4 px-8 text-sm text-gray-600">{incident.location}</td>
                                            <td className="py-4 px-8 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    incident.status === 'Resolved' 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}>
                                                    {incident.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">No incidents detected yet.</td>
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

