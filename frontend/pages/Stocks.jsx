/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { 
    FaBox, FaPlus, FaEdit, FaTrash, FaExclamationCircle, FaPlayCircle, 
    FaUserFriends, FaExclamationTriangle, FaClipboardList, FaChartLine, FaFilePdf,
    FaHardHat, FaSignOutAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const navItems=[
    {name:"Live Tracking",icon:<FaPlayCircle/>,path:"/dashboard"},
    { name: "Workers", icon: <FaUserFriends />, path: "/workers" },
    { name: "Incidents", icon: <FaExclamationTriangle />, path: "/incidents" },
    { name: "Compliance", icon: <FaClipboardList />, path: "/compliance" },
    { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
    { name: "Reports", icon: <FaFilePdf />, path: "/reports" },
    { name: "Stocks", icon: <FaBox />, path: "/stocks" },
];

const Stocks=()=>{
    const navigate = useNavigate();
    const {user, logout}=useAuth();
    const isAdmin = user?.role === "admin";
    const activeTab="Stocks";
    
    let apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    apiUrl = apiUrl.replace(/\/+$/, '');

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const[stocks,setStocks]=useState([]);
    const[showModal,setShowModal]=useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [formData, setFormData] = useState({
        item_name: "", quantity: "", unit: "", brand: "", unit_price: "",
        purchase_date: "", status: "Available", additional_info: ""
    });
    const [imageFile, setImageFile] = useState(null);

    const handleRequest = async (id) => {
        const qtyStr = window.prompt("Enter quantity to request:", "1");
        if (qtyStr === null) return; // User cancelled
        const quantity = parseInt(qtyStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("worker_name", user?.email || "Unknown Worker");
            formData.append("quantity", quantity);
            
            const response = await fetch(`${apiUrl}/api/stocks/${id}/request`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errText}`);
            }

            alert("Request sent to admin via WhatsApp! The admin has been notified.");
            fetchStocks();
        } catch (error) {
            console.error("Error requesting stock:", error);
            alert("Failed to send request. Check console for details.");
        }
    };

    const fetchStocks=async()=>{
        try{
            const res=await fetch(`${apiUrl}/api/stocks`, {
                
            });
            const data=await res.json();
            setStocks(data);
        }catch(error){
            console.error("Failed to fetch stocks");
        }
    };
    useEffect(()=>{
        fetchStocks();
    },[]);

    const handleInputChange=(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    };

    const handleFileChange=(e)=>{
        setImageFile(e.target.files[0]);
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (imageFile) data.append("image", imageFile);

        const url = editingStock 
            ? `${apiUrl}/api/stocks/${editingStock._id}`
            : `${apiUrl}/api/stocks`;
            
        const method = editingStock ? "PUT" : "POST";

        await fetch(url, { 
            method, 
            body: data 
        });
        setShowModal(false);
        setEditingStock(null);
        setImageFile(null);
        fetchStocks();
    };

    const openAdd = () => {
        setEditingStock(null);
        setFormData({
            item_name: "", quantity: 0, unit: "", brand: "", unit_price: 0,
            purchase_date: "", status: "Available", additional_info: ""
        });
        setImageFile(null);
        setShowModal(true);
    };

    const openEdit=(stock)=>{
        setEditingStock(stock);
        setFormData({
            item_name: stock.item_name, quantity: stock.quantity, unit: stock.unit,
            brand: stock.brand, unit_price: stock.unit_price, purchase_date: stock.purchase_date,
            status: stock.status, additional_info: stock.additional_info
        });
        setShowModal(true);
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
                    {navItems.filter(item => isAdmin || !["Workers", "Analytics", "Reports"].includes(item.name)).map((item) => (
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

            <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
                
                <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{activeTab}</h1>
                        <p className="text-sm text-gray-500 font-medium">Inventory Stocks</p>
                    </div>
                    {isAdmin && (
                        <button onClick={openAdd} className="bg-[#0066CC] hover:bg-[#005bb5] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all">
                            <FaPlus /> Add Stock
                        </button>
                    )}
                </header>

                <div className="p-8 overflow-y-auto flex-1 z-0">
                    {isAdmin && stocks.filter(s => s.critical_out_of_stock).length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 shadow-sm animate-in fade-in slide-in-from-top-4">
                            <FaExclamationCircle className="mt-1 text-red-500" size={20} />
                            <div>
                                <h3 className="font-bold text-red-900 text-lg">Attention Admin: Restock Requests</h3>
                                <p className="text-sm mt-1 font-medium">
                                    Workers have requested the following items: 
                                    <span className="font-bold ml-1">
                                        {stocks.filter(s => s.critical_out_of_stock).map(s => `${s.requested_quantity || 1}x ${s.item_name}`).join(', ')}
                                    </span>.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stocks.map(stock => (
                        <div key={stock._id} className={`bg-white rounded-[1.5rem] p-6 shadow-sm border ${stock.critical_out_of_stock ? 'border-red-500 shadow-red-500/20' : 'border-gray-100'}`}>
                            {stock.critical_out_of_stock && (
                                <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse">
                                    <FaExclamationCircle /> CRITICAL OUT OF STOCK
                                </div>
                            )}
                            {stock.image_url && (
                                <img src={`${apiUrl}${stock.image_url}`} alt={stock.item_name} className="w-full h-40 object-cover rounded-xl mb-4" />
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{stock.item_name}</h3>
                                <span className="text-xs text-gray-500">{stock.stock_id}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Brand: {stock.brand}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Quantity</p>
                                    <p className="text-lg font-bold text-gray-900">{stock.quantity}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Value</p>
                                    <p className="text-lg font-bold text-gray-900">Rs. {stock.total_value}</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-6">Status: <span className="font-bold text-gray-900">{stock.status}</span></p>

                            <div className="flex justify-end gap-2">
                                {isAdmin ? (
                                    <>
                                        <button onClick={() => openEdit(stock)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><FaEdit /></button>
                                        <button onClick={() => handleDelete(stock._id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><FaTrash /></button>
                                    </>
                                ) : (
                                    <button onClick={() => handleRequest(stock._id)} className="w-full bg-[#1d1d1f] text-white py-2 rounded-xl font-medium hover:bg-[#333336]">
                                        Request Stock
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

                {/* Add/Edit Modal (Admin Only) */}
                {showModal && isAdmin && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6">{editingStock ? 'Edit Stock' : 'Add New Stock'}</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm font-semibold text-gray-700">Item Name</label><input required name="item_name" value={formData.item_name} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-semibold text-gray-700">Quantity</label><input required type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-semibold text-gray-700">Unit (e.g. kg, pieces)</label><input required name="unit" value={formData.unit} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-semibold text-gray-700">Brand</label><input required name="brand" value={formData.brand} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-semibold text-gray-700">Unit Price</label><input required type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-semibold text-gray-700">Purchase Date</label><input required type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" /></div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                        <option>Available</option>
                                        <option>Reserved</option>
                                        <option>Low Stock</option>
                                        <option>Out of Stock</option>
                                    </select>
                                </div>
                                <div><label className="text-sm font-semibold text-gray-700">Image</label><input type="file" onChange={handleFileChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept="image/*" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-semibold text-gray-700">Additional Info</label><textarea name="additional_info" value={formData.additional_info} onChange={handleInputChange} className="w-full border border-gray-300 bg-gray-50 text-gray-900 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"></textarea></div>
                                
                                <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium">Cancel</button>
                                    <button type="submit" className="px-5 py-2 rounded-xl bg-[#0066CC] text-white font-medium">Save Stock</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Stocks;