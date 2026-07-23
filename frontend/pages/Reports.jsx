import { useState } from "react";
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
    FaFileCsv,
    FaCalendarCheck,
    FaShieldAlt,
    FaClipboardCheck,
    FaCalendarAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useVideo } from "../context/VideoContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const navItems = [
    { name: "Live Tracking", icon: <FaPlayCircle />, path: "/dashboard" },
    { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
    { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
    { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
    { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
    { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
];

const Reports = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { incidentsData, statsData } = useVideo();
    const activeTab = "Reports";
    
    // Tab State
    const [selectedTab, setSelectedTab] = useState("daily");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Generic CSV Download
    const downloadCSV = (headers, data, filename) => {
        const csvRows = [];
        csvRows.push(headers.join(','));
        data.forEach(row => {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Generic PDF Download
    const downloadPDF = (title, columns, dataRows, filename) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(0, 102, 204);
        doc.text("SiteWatch AI", 14, 22);
        
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(title, 14, 32);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
        
        // Table
        autoTable(doc, {
            startY: 45,
            head: [columns],
            body: dataRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204] },
            margin: { top: 45 },
        });
        
        doc.save(`${filename}.pdf`);
    };

    // Specific Downloads
    const handleDailySummary = async (type) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/daily`);
            const dataObj = await res.json();
            const title = "Daily Safety Summary";
            
            const data = [
                { Metric: "Average Active Workers", Value: dataObj.workers },
                { Metric: "Average Compliance Score", Value: `${dataObj.compliance_score}%` },
                { Metric: "Total Incidents Logged", Value: dataObj.total_incidents }
            ];

            if (type === 'csv') {
                downloadCSV(["Metric", "Value"], data, `Daily_Summary_${dataObj.date}`);
            } else {
                const rows = data.map(d => [d.Metric, d.Value]);
                downloadPDF(title, ["Metric", "Value"], rows, `Daily_Summary_${dataObj.date}`);
            }
        } catch (err) { alert("Error fetching data"); }
    };

    const handleWeeklyComprehensive = async (type) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/weekly`);
            const dataObj = await res.json();
            const title = "Weekly Safety Summary";
            
            const data = [
                { Metric: "Average Active Workers", Value: dataObj.workers },
                { Metric: "Average Compliance Score", Value: `${dataObj.compliance_score}%` },
                { Metric: "Total Incidents Logged", Value: dataObj.total_incidents },
                { Metric: "Date Range", Value: dataObj.date_range }
            ];

            if (type === 'csv') {
                downloadCSV(["Metric", "Value"], data, `Weekly_Summary`);
            } else {
                const rows = data.map(d => [d.Metric, d.Value]);
                downloadPDF(title, ["Metric", "Value"], rows, `Weekly_Summary`);
            }
        } catch (err) { alert("Error fetching data"); }
    };

    const handleIncidentLogs = async (type) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/incidents`);
            const rawData = await res.json();
            const title = "Incident Logs Report";
            const date = new Date().toISOString().split('T')[0];
            const data = rawData.map((inc, i) => ({
                ID: i + 1,
                Type: inc.type || 'Unknown',
                Time: new Date(inc.timestamp).toLocaleString(),
                Status: inc.status || "Logged"
            }));

            if (data.length === 0) {
                alert("No incident data available to download.");
                return;
            }

            if (type === 'csv') {
                downloadCSV(["ID", "Type", "Time", "Status"], data, `Incident_Logs_${date}`);
            } else {
                const rows = data.map(d => [d.ID, d.Type, d.Time, d.Status]);
                downloadPDF(title, ["ID", "Type", "Time", "Status"], rows, `Incident_Logs_${date}`);
            }
        } catch (err) { alert("Error fetching data"); }
    };

    const handleComplianceAudit = async (type) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/compliance`);
            const dataObj = await res.json();
            const title = "Compliance Audit Report";
            const date = new Date().toISOString().split('T')[0];
            
            const data = [
                { Category: "Hardhat Compliance", Violations: dataObj.helmet_violations, Status: dataObj.helmet_violations > 5 ? 'Needs Review' : 'Good' },
                { Category: "Safety Vest Compliance", Violations: dataObj.vest_violations, Status: dataObj.vest_violations > 5 ? 'Needs Review' : 'Good' },
                { Category: "Total Inspections", Violations: dataObj.total_inspections, Status: 'N/A' }
            ];

            if (type === 'csv') {
                downloadCSV(["Category", "Violations", "Status"], data, `Compliance_Audit_${date}`);
            } else {
                const rows = data.map(d => [d.Category, d.Violations, d.Status]);
                downloadPDF(title, ["Category", "Violations", "Status"], rows, `Compliance_Audit_${date}`);
            }
        } catch (err) { alert("Error fetching data"); }
    };

    const reportTypes = [
        { 
            id: "daily", 
            title: "Daily Summary", 
            icon: <FaCalendarCheck size={20} />, 
            desc: "A high-level overview of today's key safety metrics and general site status.",
            handler: handleDailySummary
        },
        { 
            id: "weekly", 
            title: "Weekly Comprehensive", 
            icon: <FaCalendarAlt size={20} />, 
            desc: "An aggregated report of all metrics, incidents, and trends over the past 7 days.",
            handler: handleWeeklyComprehensive
        },
        { 
            id: "incidents", 
            title: "Incident Logs", 
            icon: <FaExclamationTriangle size={20} />, 
            desc: "A detailed log of all recorded safety incidents, including timestamps and classifications.",
            handler: handleIncidentLogs
        },
        { 
            id: "compliance", 
            title: "Compliance Audits", 
            icon: <FaClipboardCheck size={20} />, 
            desc: "Breakdown of safety protocol adherence based on AI vision detections.",
            handler: handleComplianceAudit
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
                        <p className="text-sm text-gray-500 font-medium">Export and schedule automated reports</p>
                    </div>
                </header>

                <div className="p-8 overflow-y-auto flex-1 z-0">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
                        {/* Tabs List */}
                        <div className="w-full md:w-1/3 flex flex-col gap-2">
                            {reportTypes.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${
                                        selectedTab === tab.id
                                        ? "bg-[#0066CC] text-white shadow-lg shadow-blue-500/20 transform scale-[1.02]"
                                        : "bg-white/60 hover:bg-white text-gray-600 hover:text-[#1d1d1f] border border-transparent hover:border-gray-200"
                                    }`}
                                >
                                    <div className={selectedTab === tab.id ? "text-white" : "text-[#0066CC]"}>
                                        {tab.icon}
                                    </div>
                                    <span className="font-semibold">{tab.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="w-full md:w-2/3 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
                            {reportTypes.map((tab) => (
                                selectedTab === tab.id && (
                                    <div key={tab.id} className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="bg-blue-50 text-[#0066CC] p-4 rounded-2xl">
                                                {tab.icon}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{tab.title}</h2>
                                                <p className="text-gray-500 mt-1">{tab.desc}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 flex-1">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Export Options</h3>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <button 
                                                    onClick={() => tab.handler('pdf')}
                                                    className="flex-1 flex justify-center items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                                                >
                                                    <FaFilePdf /> Download PDF
                                                </button>
                                                <button 
                                                    onClick={() => tab.handler('csv')}
                                                    className="flex-1 flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                                                >
                                                    <FaFileCsv /> Download CSV
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-400 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex gap-3">
                                            <FaShieldAlt className="text-blue-400 text-lg flex-shrink-0" />
                                            <span>
                                                Data is fetched from the backend database reflecting all historically recorded safety metrics and incidents.
                                            </span>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;