/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
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
  FaChartBar,
  FaShieldAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useVideo } from "../context/VideoContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const navItems = [
  { name: "Live Tracking", icon: <FaPlayCircle />, path: "/dashboard" },
  { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
  { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
  { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
  { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
  { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
];

const Analytics = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const activeTab = "Analytics";

  const { statsData, history, incidentsData } = useVideo();

  let helmetCount = 0;
  let vestCount = 0;

  (incidentsData || []).forEach(inc => {
    if (inc.type.toLowerCase().includes("helmet")) helmetCount++;
    if (inc.type.toLowerCase().includes("vest")) vestCount++;
  });

  const incidentBreakdown = { helmet: helmetCount, vest: vestCount };
const handleLogout = () => {
  logout();
  navigate("/login");
};

const maxHelmet = Math.max(incidentBreakdown.helmet, 1);
const maxVest = Math.max(incidentBreakdown.vest, 1);

const overallMax = Math.max(maxHelmet, maxVest, 10);

return (
  <div className="min-h-screen w-full flex bg-[#F5F5F7]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
          <Link key={item.name}
            to={item.path}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.name ? "bg-[#0066CC] text-white shadow-md shadow-[#0066CC]/20" : "text-gray-600 hover:bg-black/5 hover:text-gray-900"}`}>
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

      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-400/10 blur-[100px] pointer-events-none" />

      {/* Topbar */}
      <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{activeTab}</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time metrics from video detections</p>
        </div>
      </header>
      {/* Dashboard Content */}
      <div className="p-8 overflow-y-auto flex-1 z-0 space-y-8">

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-semibold text-gray-500 tracking-tight">Active Workers</p>
              <h3 className="text-3xl font-bold text-[#1d1d1f] mt-2 tracking-tight">{statsData.workers}</h3>
            </div>
            <div className="bg-blue-500/10 text-blue-500 p-4 rounded-2xl">
              <FaUserFriends size={24} />
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-semibold text-gray-500 tracking-tight">Avg. Compliance</p>
              <h3 className="text-3xl font-bold text-[#1d1d1f] mt-2 tracking-tight">{statsData.compliance_score}%</h3>
            </div>
            <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl">
              <FaShieldAlt size={24} />
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-semibold text-gray-500 tracking-tight">Total Incidents</p>
              <h3 className="text-3xl font-bold text-[#1d1d1f] mt-2 tracking-tight">{statsData.total_incidents}</h3>
            </div>
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl">
              <FaExclamationTriangle size={24} />
            </div>
          </div>
        </div>
        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Live Compliance Trend */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-2">
                <FaChartLine className="text-[#0066CC]" /> Live Compliance Trend
              </h2>
            </div>

            <div className="h-64 w-full">
              {history.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">Waiting for video stream data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="compliance" stroke="#0066CC" strokeWidth={3} dot={{ r: 4, fill: "#0066CC", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Incident Breakdown */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-2">
                <FaChartBar className="text-[#E8A33D]" /> Incident Breakdown
              </h2>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={[
                    { name: 'Missing Helmet', value: incidentBreakdown.helmet, fill: '#ef4444' },
                    { name: 'Missing Vest', value: incidentBreakdown.vest, fill: '#f97316' },
                    { name: 'Unsafe Zone', value: 0, fill: '#eab308' }
                  ]}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} fontWeight={500} width={100} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};

export default Analytics;