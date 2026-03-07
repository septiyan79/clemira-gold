// src/components/AdminRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    // kalau masih loading auth → jangan render apa2 dulu
    if (loading) {
        return <div>Loading...</div>; // atau spinner
    }

    // kalau belum login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // kalau bukan admin
    if (user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    // kalau admin → boleh masuk
    return children;
}
