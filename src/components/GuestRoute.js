import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase"; // sesuaikan path firebase.js kamu

export default function GuestRoute({ children }) {
    const [user, loading] = useAuthState(auth);

    if (loading) return null; // atau spinner loading
    if (user) return <Navigate to="/" />; // arahkan ke home kalau sudah login

    return children;
}
