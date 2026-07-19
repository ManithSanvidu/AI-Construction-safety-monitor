import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Incidents from "./pages/Incidents";
import Workers from "./pages/Workers";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
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
                    <ProtectedRoute>
                        <Upload />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
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
                path="/workers"
                element={
                    <ProtectedRoute>
                        <Workers />
                    </ProtectedRoute>
                }
            />

            {/* 404 page */}
            <Route path="/404" element={<NotFound />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
    );
}

export default App;
