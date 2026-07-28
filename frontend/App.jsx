import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Incidents from "./pages/Incidents";
import Workers from "./pages/Workers";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";
import Stocks from "./pages/Stocks";

import ProtectedRoute from "./components/ProtectedRoute";
import { VideoProvider } from "./context/VideoContext";
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
    return (
        <VideoProvider>
        <Routes>

            {/* Public Route */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/upload"
                element={
                    <ProtectedRoute adminOnly>
                        <Upload />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute adminOnly>
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <ProtectedRoute adminOnly>
                        <Reports />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/incidents"
                element={
                    <ProtectedRoute>
                        <Incidents />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/compliance"
                element={
                    <ProtectedRoute>
                        <Compliance />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/workers"
                element={
                    <ProtectedRoute adminOnly>
                        <Workers />
                    </ProtectedRoute>
                }
            />
            <Route path="/stocks" element={<Stocks />} />

            {/* 404 page */}
            <Route path="/404" element={<NotFound />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
        <ChatbotWidget />
        </VideoProvider>
    );
}

export default App;
