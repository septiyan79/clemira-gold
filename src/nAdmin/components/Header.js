import React, { useEffect } from "react";

export default function Header() {
    useEffect(() => {
        // Inisialisasi Bootstrap jQuery
        const initJqueryUI = () => {
            if (window.$) {
                try {
                    window.$('[data-toggle="dropdown"]').dropdown();
                    window.$('[data-toggle="collapse"]').collapse();
                    window.$('[data-toggle="tooltip"]').tooltip();
                    window.$('[data-toggle="popover"]').popover();
                } catch (e) {
                    console.warn("Bootstrap jQuery init failed:", e);
                }
            } else {
                console.warn("jQuery not found in window.$");
            }
        };

        initJqueryUI();
        const observer = new MutationObserver(() => initJqueryUI());
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <header className="topbar">
            <nav className="navbar top-navbar navbar-expand-md navbar-dark">
                <div className="navbar-header">
                    {/* Sidebar toggle for mobile */}
                    <a
                        className="nav-toggler waves-effect waves-light d-block d-md-none"
                        href="#!"
                        onClick={(e) => {
                            e.preventDefault();
                            const wrapper = document.getElementById("main-wrapper");
                            wrapper?.classList.toggle("show-sidebar");
                        }}
                    >
                        <i className="ti-menu ti-close"></i>
                    </a>

                    {/* Logo */}
                    <div className="navbar-brand">
                        <a href="#!" className="logo">
                            <b className="logo-icon">
                                <img
                                    src="/assets-nAdmin/assets/images/logo-icon.png"
                                    alt="homepage"
                                    className="dark-logo"
                                />
                                <img
                                    src="/assets-nAdmin/assets/images/logo-light-icon.png"
                                    alt="homepage"
                                    className="light-logo"
                                />
                            </b>
                            <span className="logo-text">
                                <img
                                    src="/assets-nAdmin/assets/images/logo-text.png"
                                    alt="homepage"
                                    className="dark-logo"
                                />
                                <img
                                    src="/assets-nAdmin/assets/images/logo-light-text.png"
                                    className="light-logo"
                                    alt="homepage"
                                />
                            </span>
                        </a>

                        {/* Sidebar toggle for desktop */}
                        <a
                            className="sidebartoggler d-none d-md-block"
                            href="#!"
                            onClick={(e) => {
                                e.preventDefault();
                                const wrapper = document.getElementById("main-wrapper");
                                wrapper?.classList.toggle("mini-sidebar");
                            }}
                        >
                            <i className="mdi mdi-toggle-switch mdi-toggle-switch-off font-20"></i>
                        </a>
                    </div>

                    {/* Mobile topbar toggler */}
                    <a
                        className="topbartoggler d-block d-md-none waves-effect waves-light"
                        href="#!"
                        data-toggle="collapse"
                        data-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <i className="ti-more"></i>
                    </a>
                </div>

                {/* Navbar content */}
                <div className="navbar-collapse collapse" id="navbarSupportedContent">
                    {/* Left side */}
                    <ul className="navbar-nav float-left mr-auto align-items-center">
                        {/* 🔍 Search bar biasa */}
                        <li className="nav-item d-none d-md-block" style={{ minWidth: "250px" }}>
                            <form
                                className="d-flex align-items-center position-relative"
                                style={{ marginLeft: "10px" }}
                            >
                                <i
                                    className="mdi mdi-magnify position-absolute"
                                    style={{
                                        left: "12px",
                                        color: "#777",
                                        fontSize: "18px",
                                    }}
                                ></i>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search..."
                                    style={{
                                        backgroundColor: "#f3f3f3",
                                        color: "#333",
                                        border: "1px solid #ddd",
                                        borderRadius: "30px",
                                        paddingLeft: "35px",
                                        height: "34px",
                                        transition: "all 0.3s ease",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.backgroundColor = "#fff";
                                        e.target.style.border = "1px solid #bbb";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.backgroundColor = "#f3f3f3";
                                        e.target.style.border = "1px solid #ddd";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </form>
                        </li>
                                    

                    </ul>

                    {/* Right side */}
                    <ul className="navbar-nav float-right">
                        {/* Messages dropdown */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle waves-effect waves-dark"
                                href="#!"
                                id="2"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i className="font-22 mdi mdi-email-outline"></i>
                            </a>
                            <div
                                className="dropdown-menu dropdown-menu-right mailbox animated bounceInDown"
                                aria-labelledby="2"
                            >
                                <span className="with-arrow">
                                    <span className="bg-danger"></span>
                                </span>
                                <ul className="list-style-none">
                                    <li>
                                        <div className="drop-title text-white bg-danger">
                                            <h4 className="m-b-0 m-t-5">5 New</h4>
                                            <span className="font-light">Messages</span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="message-center message-body">
                                            <a href="#!" className="message-item">
                                                <span className="user-img">
                                                    <img
                                                        src="/assets-nAdmin/assets/images/users/1.jpg"
                                                        alt="user"
                                                        className="rounded-circle"
                                                    />
                                                    <span className="profile-status online pull-right"></span>
                                                </span>
                                                <div className="mail-contnet">
                                                    <h5 className="message-title">Pavan kumar</h5>
                                                    <span className="mail-desc">
                                                        Just see the my admin!
                                                    </span>
                                                    <span className="time">9:30 AM</span>
                                                </div>
                                            </a>
                                        </div>
                                    </li>
                                    <li>
                                        <a className="nav-link text-center link text-dark" href="#!">
                                            <b>See all e-Mails</b>
                                            <i className="fa fa-angle-right"></i>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        {/* Notifications dropdown */}
                        <li className="nav-item dropdown border-right">
                            <a
                                className="nav-link dropdown-toggle waves-effect waves-dark"
                                href="#!"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i className="mdi mdi-bell-outline font-22"></i>
                                <span className="badge badge-pill badge-info noti">3</span>
                            </a>
                        </li>

                        {/* User profile */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle waves-effect waves-dark pro-pic"
                                href="#!"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <img
                                    src="/assets-nAdmin/assets/images/users/2.jpg"
                                    alt="user"
                                    className="rounded-circle"
                                    width="40"
                                />
                                <span className="m-l-5 font-medium d-none d-sm-inline-block">
                                    Jonathan Doe <i className="mdi mdi-chevron-down"></i>
                                </span>
                            </a>
                            <div className="dropdown-menu dropdown-menu-right user-dd animated flipInY">
                                <span className="with-arrow">
                                    <span className="bg-primary"></span>
                                </span>
                                <div className="d-flex no-block align-items-center p-15 bg-primary text-white m-b-10">
                                    <div>
                                        <img
                                            src="/assets-nAdmin/assets/images/users/2.jpg"
                                            alt="user"
                                            className="rounded-circle"
                                            width="60"
                                        />
                                    </div>
                                    <div className="m-l-10">
                                        <h4 className="m-b-0">Jonathan Doe</h4>
                                        <p className="m-b-0">jon@gmail.com</p>
                                    </div>
                                </div>
                                <div className="profile-dis scrollable">
                                    <a className="dropdown-item" href="#!">
                                        <i className="ti-user m-r-5 m-l-5"></i> My Profile
                                    </a>
                                    <a className="dropdown-item" href="#!">
                                        <i className="ti-wallet m-r-5 m-l-5"></i> My Balance
                                    </a>
                                    <a className="dropdown-item" href="#!">
                                        <i className="ti-email m-r-5 m-l-5"></i> Inbox
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#!">
                                        <i className="ti-settings m-r-5 m-l-5"></i> Account Setting
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#!">
                                        <i className="fa fa-power-off m-r-5 m-l-5"></i> Logout
                                    </a>
                                </div>
                                <div className="p-l-30 p-10">
                                    <a href="#!" className="btn btn-sm btn-success btn-rounded">
                                        View Profile
                                    </a>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}
