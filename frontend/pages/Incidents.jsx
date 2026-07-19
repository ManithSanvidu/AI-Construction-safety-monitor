import { useState, useEffect } from "react";
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
    FaSignOutAlt
} from "react-icons/fa";

const navItems = [
    { name: "Live Tracking", icon: <FaPlayCircle />, path: "/" },
    { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
    { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
    { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
    { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
    { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
];

const Incidents = () => {
    const navigate = useNavigate();
    const activeTab = "Incidents";
    const [incidentsData, setIncidentsData] = useState([]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/incidents`);
                if (res.ok) {
                    const data = await res.json();
                    setIncidentsData(data.incidents || []);
                }
            } catch (e) {
                console.error("Failed to fetch incidents:", e);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        navigate("/login");
    };

    return (
        <div className="min-h-screen w-full flex bg-[#F5F5F7]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            
            {/* Sidebar */}
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
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
                
                {/* Topbar */}
                <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{activeTab}</h1>
                        <p className="text-sm text-gray-500 font-medium">Monitor your construction site safety</p>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 overflow-y-auto flex-1 z-0 space-y-8">
                    
                    {/* Incidents Table */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">All Incidents</h2>
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
};

export default Incidents;
