import { Outlet } from "react-router-dom";
import Navbar from "../components/admin/Navbar";
import Sidebar from "../components/admin/Sidebar";
import Footer from "../components/admin/Footer";
import { useEffect } from "react";

import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';

import $ from 'jquery';
import 'datatables.net-dt';


export default function AdminLayout() {
    useEffect(() => {
        // === Tambah CSS template admin ===
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = process.env.PUBLIC_URL + "/assets-admin/css/styles.css";
        document.head.appendChild(link);

        // === Font Awesome ===
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        document.head.appendChild(fa);

        // cleanup saat unmount
        return () => {
            document.head.removeChild(link);
            document.head.removeChild(fa);
        };
    }, []);

    return (
        <>
            <Navbar />
            <div id="layoutSidenav">
                <Sidebar />
                <div id="layoutSidenav_content">
                    <Outlet /> {/* Halaman admin akan tampil di sini */}
                    <Footer />
                </div>
            </div>
        </>
    );
}
