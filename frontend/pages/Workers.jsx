import { useState, useEffect } from "react";
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
    FaLock
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const navItems = [
    { name: "Live Tracking", icon: <FaPlayCircle />, path: "/dashboard" },
    { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
    { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
    { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
    { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
    { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
];

const Workers = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const activeTab = "Workers";

    // Check if the current user is an admin
    const isAdmin = user && user.email === "admin@sitewatch.lk";

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only attempt to fetch if the user is an admin
        if (isAdmin) {
            const fetchWorkers = async () => {
                try {
                    // Assuming you have this endpoint implemented in the backend
                    // If not, you will need to add a GET /api/users endpoint in auth.py
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/users`, {
                        headers: {
                            "Authorization": `Bearer ${user.token}`
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Filter out the admin user from the list
                        const nonAdminUsers = data.filter(w => w.email !== "admin@sitewatch.lk");
                        setWorkers(nonAdminUsers);
                    }
                } catch (error) {
                    console.error("Failed to fetch workers:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchWorkers();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
        }
    }, [isAdmin, user]);

    const handleLogout = () => {
        logout();
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.name
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
                        <p className="text-sm text-gray-500 font-medium">Manage registered personnel</p>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 overflow-y-auto flex-1 z-0 space-y-8">

                    {!isAdmin ? (
                        <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-red-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                <FaLock size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Access Denied</h2>
                            <p className="text-gray-500 max-w-md text-center">
                                You do not have permission to view the workers directory. This page is restricted to administrators only.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Statistics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 tracking-tight">Total Registered Workers</p>
                                        <h3 className="text-3xl font-bold text-[#1d1d1f] mt-2 tracking-tight">{workers.length}</h3>
                                    </div>
                                    <div className="bg-blue-500/10 text-blue-500 p-3 rounded-2xl">
                                        <FaUserFriends size={28} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Registered Personnel</h2>
                                    <span className="text-sm font-medium text-gray-500">{workers.length} workers found</span>
                                </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</th>
                                            <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="text-left py-4 px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">Loading workers...</td>
                                            </tr>
                                        ) : workers.length > 0 ? workers.map((worker, index) => (
                                            <tr key={worker.id || index} className="hover:bg-white/50 transition-colors">
                                                <td className="py-4 px-8 text-sm font-medium text-gray-900">{worker.name}</td>
                                                <td className="py-4 px-8 text-sm text-gray-600">{worker.email}</td>
                                                <td className="py-4 px-8 text-sm text-gray-600">Site Worker</td>
                                                <td className="py-4 px-8 text-sm">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">No registered workers found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Workers;
