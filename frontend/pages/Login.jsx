import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHardHat, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            setError("Please enter your email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: form.email, password: form.password })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Invalid credentials");
            }

            const data = await response.json();
            login({ email: form.email, token: data.access_token });
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#F5F5F7]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            {/* Left Column (Brand/Info) */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1d1d1f] to-[#000000] text-white p-12">
                {/* Subtle glass orb effect */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#E8A33D]/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-lg">
                        <FaHardHat size={24} className="text-[#E8A33D]" />
                    </div>
                    <span className="text-xl tracking-tight font-semibold">
                        SiteWatch AI
                    </span>
                </div>

                <div className="relative z-10 max-w-md mt-16">
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#E8A33D] font-medium mb-6 px-3 py-1 bg-[#E8A33D]/10 rounded-full border border-[#E8A33D]/20 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#E8A33D] animate-pulse shadow-[0_0_8px_#E8A33D]" />
                        Live on 6 sites
                    </span>
                    <h1 className="text-5xl leading-tight font-semibold mb-6 tracking-tight">
                        Every hard hat,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">every zone, watched.</span>
                    </h1>
                    <p className="text-gray-400 text-lg leading-relaxed font-light">
                        Computer-vision monitoring that flags missing PPE and unsafe
                        zones as they happen, so your safety team acts in minutes.
                    </p>
                </div>
                
                <div className="relative z-10 flex items-center gap-8 mt-auto mb-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <div>
                        <div className="text-3xl text-white font-medium tracking-tight">98.4%</div>
                        <div className="mt-1 text-sm text-gray-400 font-medium">Detection accuracy</div>
                    </div>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    <div>
                        <div className="text-3xl text-white font-medium tracking-tight">1.2s</div>
                        <div className="mt-1 text-sm text-gray-400 font-medium">Avg. alert time</div>
                    </div>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-[#F5F5F7]">
                <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="bg-[#1d1d1f] text-white p-3 rounded-2xl shadow-md">
                            <FaHardHat size={24} className="text-[#E8A33D]" />
                        </div>
                        <span className="text-2xl tracking-tight font-semibold text-[#1d1d1f]">
                            SiteWatch AI
                        </span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
                            Welcome back
                        </h2>
                        <p className="text-gray-500 font-medium">Sign in to monitor your active sites.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50/50 backdrop-blur-md text-red-600 rounded-2xl text-sm border border-red-100 flex items-center shadow-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0066CC] transition-colors">
                                    <FaEnvelope size={15} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#0066CC]/20 focus:border-[#0066CC] transition-all shadow-sm text-gray-900 placeholder-gray-400 font-medium"
                                    placeholder="safety.admin@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-gray-700">Password</label>
                                <Link to="#" className="text-sm font-semibold text-[#0066CC] hover:text-[#0055AA] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0066CC] transition-colors">
                                    <FaLock size={15} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-12 py-3.5 bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#0066CC]/20 focus:border-[#0066CC] transition-all shadow-sm text-gray-900 placeholder-gray-400 font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0066CC] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#0055AA] hover:shadow-lg hover:shadow-[#0066CC]/20 focus:ring-4 focus:ring-[#0066CC]/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? "Signing In..." : "Sign In to Dashboard"}
                            {!isLoading && <FaArrowRight size={14} />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-[#0066CC] hover:text-[#0055AA] transition-colors">
                            Request access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
