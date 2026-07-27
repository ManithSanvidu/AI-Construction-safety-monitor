/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
    FaBox, FaPlus, FaEdit, FaTrash, FaExclamationCircle, FaPlayCircle, 
    FaUserFriends, FaExclamationTriangle, FaClipboardList, FaChartLine, FaFilePdf 
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
    const {user}=useAuth();
    const isAdmin=user?.email==="admin@sitewatch.lk";
    const activeTab="Stocks";

    const[stocks,setStocks]=useState([]);
    const[showModal,setShowModal]=useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [formData, setFormData] = useState({
        item_name: "", quantity: "", unit: "", brand: "", unit_price: "",
        purchase_date: "", status: "Available", additional_info: ""
    });
    const [imageFile, setImageFile] = useState(null);

    const fetchStocks=async()=>{
        try{
            const res=await fetch(`${import.meta.env.VITE_API_BASE_URL}/stocks`);
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
            ? `${import.meta.env.VITE_API_BASE_URL}/stocks/${editingStock._id}`
            : `${import.meta.env.VITE_API_BASE_URL}/stocks`;
            
        const method = editingStock ? "PUT" : "POST";

        await fetch(url, { method, body: data });
        setShowModal(false);
        setEditingStock(null);
        setImageFile(null);
        fetchStocks();
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
        <div className="min-h-screen w-full flex bg-[#F5F5F7]">
            {/* Minimal Sidebar implementation for copy-paste simplicity */}
            <aside className="w-64 bg-white/60 backdrop-blur-2xl border-r border-gray-200/50 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 font-semibold text-lg border-b border-gray-200/50">SiteWatch AI</div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${activeTab === item.name ? "bg-[#0066CC] text-white" : "text-gray-600 hover:bg-black/5"}`}>
                            {item.icon} {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-[#1d1d1f]">Inventory Stocks</h1>
                    {isAdmin && (
                        <button onClick={() => { setEditingStock(null); setShowModal(true); }} className="bg-[#0066CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md">
                            <FaPlus /> Add Stock
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stocks.map(stock => (
                        <div key={stock._id} className={`bg-white rounded-[1.5rem] p-6 shadow-sm border ${stock.critical_out_of_stock ? 'border-red-500 shadow-red-500/20' : 'border-gray-100'}`}>
                            {stock.critical_out_of_stock && (
                                <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse">
                                    <FaExclamationCircle /> CRITICAL OUT OF STOCK
                                </div>
                            )}
                            {stock.image_url && (
                                <img src={`http://localhost:8000${stock.image_url}`} alt={stock.item_name} className="w-full h-40 object-cover rounded-xl mb-4" />
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{stock.item_name}</h3>
                                <span className="text-xs text-gray-500">{stock.stock_id}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Brand: {stock.brand}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p>
                                    <p className="font-semibold">{stock.quantity} {stock.unit}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
                                    <p className="font-semibold">${stock.total_value}</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-6">Status: <span className="font-bold">{stock.status}</span></p>

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

                {/* Add/Edit Modal (Admin Only) */}
                {showModal && isAdmin && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6">{editingStock ? 'Edit Stock' : 'Add New Stock'}</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm text-gray-500">Item Name</label><input required name="item_name" value={formData.item_name} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div><label className="text-sm text-gray-500">Quantity</label><input required type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div><label className="text-sm text-gray-500">Unit (e.g. kg, pieces)</label><input required name="unit" value={formData.unit} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div><label className="text-sm text-gray-500">Brand</label><input required name="brand" value={formData.brand} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div><label className="text-sm text-gray-500">Unit Price</label><input required type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div><label className="text-sm text-gray-500">Purchase Date</label><input required type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
                                <div>
                                    <label className="text-sm text-gray-500">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded-lg p-2">
                                        <option>Available</option>
                                        <option>Reserved</option>
                                        <option>Low Stock</option>
                                        <option>Out of Stock</option>
                                    </select>
                                </div>
                                <div><label className="text-sm text-gray-500">Image</label><input type="file" onChange={handleFileChange} className="w-full border rounded-lg p-2" accept="image/*" /></div>
                                <div className="md:col-span-2"><label className="text-sm text-gray-500">Additional Info</label><textarea name="additional_info" value={formData.additional_info} onChange={handleInputChange} className="w-full border rounded-lg p-2"></textarea></div>
                                
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