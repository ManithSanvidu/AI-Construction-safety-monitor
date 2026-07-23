import { Link, useNavigate } from "react-router-dom";
import {
    FaHardHat,
    FaUserFriends,
    FaExclamationTriangle,
    FaClipboardList,
    FaChartLine,
    FaFilePdf,
    FaPlayCircle,
    FaSignOutAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaShieldAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useVideo } from "../context/VideoContext";

const navItems = [
    { name: "Live Tracking", icon: <FaPlayCircle />, path: "/dashboard" },
    { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
    { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
    { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
    { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
    { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
];

const Compliance = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { statsData, incidentsData } = useVideo();
    const activeTab = "Compliance";

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Calculate compliance violations based on recent incidents
    let helmetViolations = 0;
    let vestViolations = 0;
    
    (incidentsData || []).forEach(inc => {
        if (inc.type.toLowerCase().includes("helmet")) helmetViolations++;
        if (inc.type.toLowerCase().includes("vest")) vestViolations++;
    });

    const complianceRules = [
        {
            id: 1,
            title: "Hardhat Requirement",
            description: "All workers must wear hardhats in active construction zones.",
            status: helmetViolations > 5 ? "warning" : "good",
            violations: helmetViolations,
            icon: <FaHardHat size={20} />
        },
        {
            id: 2,
            title: "High-Visibility Vest",
            description: "Safety vests are mandatory for all personnel on site.",
            status: vestViolations > 5 ? "warning" : "good",
            violations: vestViolations,
            icon: <FaShieldAlt size={20} />
        },
        {
            id: 3,
            title: "Restricted Zone Access",
            description: "Unauthorized personnel prohibited in hazardous areas.",
            status: "good",
            violations: 0,
            icon: <FaExclamationTriangle size={20} />
        }
    ];

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
                
                <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{activeTab}</h1>
                        <p className="text-sm text-gray-500 font-medium">Monitor safety protocol adherence</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                        <FaShieldAlt className="text-[#0066CC]" />
                        <span className="font-semibold text-[#1d1d1f]">Score: {statsData?.compliance_score || 100}%</span>
                    </div>
                </header>

                <div className="p-8 overflow-y-auto flex-1 z-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {complianceRules.map(rule => (
                            <div key={rule.id} className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:scale-[1.02] transition-transform flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${rule.status === 'good' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {rule.icon}
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${rule.status === 'good' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {rule.status === 'good' ? <FaCheckCircle /> : <FaTimesCircle />}
                                        {rule.status === 'good' ? 'Compliant' : 'Action Needed'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight mb-2">{rule.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 flex-1">{rule.description}</p>
                                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">Recent Violations</span>
                                    <span className={`text-lg font-bold ${rule.violations > 0 ? 'text-red-500' : 'text-[#1d1d1f]'}`}>{rule.violations}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Compliance;