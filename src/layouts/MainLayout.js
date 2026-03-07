import { Outlet } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "../components/public/Navbar";
import Footer from "../components/public/Footer";

export default function MainLayout() {

    useEffect(() => {
        // buat elemen link
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = process.env.PUBLIC_URL + "/assets-dashboard/css/styles.css";
        document.head.appendChild(link);

        // bersihkan saat unmount
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <Outlet />
            </div>
            <Footer />
        </>
    );
}
