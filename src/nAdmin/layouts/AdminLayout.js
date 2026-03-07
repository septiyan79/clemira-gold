import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";



export default function AdminLayout() {
    useEffect(() => {
        // === Tambah CSS template nAdmin ===
        const cssFiles = [
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/css/style.css",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/css/style.min.css",
            // "https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css",
            // process.env.PUBLIC_URL + "/assets-nAdmin/assets/css/overrides.css",
        ];

        cssFiles.forEach(href => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        });

        // === Tambah JS template nAdmin ===
        const jsFiles = [
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/libs/jquery/dist/jquery.min.js",
            // "https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js",
            // "https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/libs/popper.js/dist/umd/popper.min.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/libs/bootstrap/dist/js/bootstrap.min.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/libs/perfect-scrollbar/dist/perfect-scrollbar.jquery.min.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/assets/extra-libs/sparkline/sparkline.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/app.min.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/app.init.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/app-style-switcher.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/waves.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/sidebarmenu.js",
            process.env.PUBLIC_URL + "/assets-nAdmin/dist/js/custom.min.js",
        ];

        jsFiles.forEach(src => {
            const script = document.createElement("script");
            script.src = src;
            script.async = false; // biar urut
            document.body.appendChild(script);
        });

        // === Optional cleanup saat keluar halaman ===
        return () => {
            cssFiles.forEach(href => {
                const linkTag = document.querySelector(`link[href="${href}"]`);
                if (linkTag) document.head.removeChild(linkTag);
            });
            jsFiles.forEach(src => {
                const scriptTag = document.querySelector(`script[src="${src}"]`);
                if (scriptTag) document.body.removeChild(scriptTag);
            });
        };
    }, []);

    return (
        <>
            {/* ============================================================== */}
            {/* Preloader - style you can find in spinners.css */}
            {/* ============================================================== */}
            <div className="preloader">
                <div className="lds-ripple">
                    <div className="lds-pos"></div>
                    <div className="lds-pos"></div>
                </div>
            </div>
            {/* ============================================================== */}
            {/* Main wrapper - style you can find in pages.scss */}
            {/* ============================================================== */}
            <div id="main-wrapper">
                <Header />
                <Sidebar />
                <div className="page-wrapper">
                    <Outlet />
                    <Footer />
                </div>
            </div>
        </>
    );
}
