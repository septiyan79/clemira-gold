import { useAuth } from "../../AuthContext";

export default function Sidebar() {
    const { user } = useAuth();

    return (

        <div id="layoutSidenav_nav">
            <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
                <div className="sb-sidenav-menu">
                    <div className="nav">

                        {/* ================== CORE ======================= */}
                        <div className="sb-sidenav-menu-heading">Core</div>
                        <a className="nav-link" href="/admin">
                            <div className="sb-nav-link-icon"><i className="fas fa-tachometer-alt"></i></div>
                            Dashboard
                        </a>

                        {/* ======================= ACCOUNT ========================== */}
                        <div className="sb-sidenav-menu-heading">Account</div>
                        <a className="nav-link" href="/admin/kelola-user">
                            <div className="sb-nav-link-icon"><i className="fas fa-user"></i></div>
                            User Management
                        </a>

                        {/* ======================== PRICE ========================== */}
                        <div className="sb-sidenav-menu-heading">Price</div>
                        <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#antam" aria-expanded="false" aria-controls="antam">
                            <div className="sb-nav-link-icon"><i className="fas fa-columns"></i></div>
                            Antam Price
                            <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
                        </a>
                        <div className="collapse" id="antam" aria-labelledby="headingOne" data-bs-parent="#sidenavAccordion">
                            <nav className="sb-sidenav-menu-nested nav">
                                <a className="nav-link" href="layout-static.html">Price Management</a>
                                <a className="nav-link" href="layout-sidenav-light.html">Monthly Tracker</a>
                                <a className="nav-link" href="layout-sidenav-light.html">Annual Tracker</a>
                            </nav>
                        </div>
                        <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#clemira" aria-expanded="false" aria-controls="clemira">
                            <div className="sb-nav-link-icon"><i className="fas fa-columns"></i></div>
                            Clemira Price
                            <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
                        </a>
                        <div className="collapse" id="clemira" aria-labelledby="headingOne" data-bs-parent="#sidenavAccordion">
                            <nav className="sb-sidenav-menu-nested nav">
                                <a className="nav-link" href="layout-static.html">Price Management</a>
                                <a className="nav-link" href="layout-sidenav-light.html">Monthly Tracker</a>
                                <a className="nav-link" href="layout-sidenav-light.html">Annual Tracker</a>
                            </nav>
                        </div>

                        {/* ================== CLEMIRA GOLD ASSETS ========================== */}
                        <div className="sb-sidenav-menu-heading">Clemira Gold assets</div>
                        <a className="nav-link" href="#">
                            <div className="sb-nav-link-icon"><i className="fas fa-user"></i></div>
                            Gold Stock
                        </a>

                        <a className="nav-link" href="#">
                            <div className="sb-nav-link-icon"><i className="fas fa-user"></i></div>
                            Margin Recap
                        </a>

                        <a className="nav-link" href="#">
                            <div className="sb-nav-link-icon"><i className="fas fa-user"></i></div>
                            Gain Value Estimate
                        </a>


                        {/* ======================== User's Gold ========================== */}
                        <div className="sb-sidenav-menu-heading">User's Gold</div>
                        <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#collapsePages" aria-expanded="false" aria-controls="collapsePages">
                            <div className="sb-nav-link-icon"><i className="fas fa-book-open"></i></div>
                            Draft
                            <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
                        </a>
                        <div className="collapse" id="collapsePages" aria-labelledby="headingTwo" data-bs-parent="#sidenavAccordion">
                            <nav className="sb-sidenav-menu-nested nav accordion" id="sidenavAccordionPages">
                                <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#pagesCollapseAuth" aria-expanded="false" aria-controls="pagesCollapseAuth">
                                    Authentication
                                    <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
                                </a>
                                <div className="collapse" id="pagesCollapseAuth" aria-labelledby="headingOne" data-bs-parent="#sidenavAccordionPages">
                                    <nav className="sb-sidenav-menu-nested nav">
                                        <a className="nav-link" href="login.html">Login</a>
                                        <a className="nav-link" href="register.html">Register</a>
                                        <a className="nav-link" href="password.html">Forgot Password</a>
                                    </nav>
                                </div>
                                <a className="nav-link collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#pagesCollapseError" aria-expanded="false" aria-controls="pagesCollapseError">
                                    Error
                                    <div className="sb-sidenav-collapse-arrow"><i className="fas fa-angle-down"></i></div>
                                </a>
                                <div className="collapse" id="pagesCollapseError" aria-labelledby="headingOne" data-bs-parent="#sidenavAccordionPages">
                                    <nav className="sb-sidenav-menu-nested nav">
                                        <a className="nav-link" href="401.html">401 Page</a>
                                        <a className="nav-link" href="404.html">404 Page</a>
                                        <a className="nav-link" href="500.html">500 Page</a>
                                    </nav>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
                <div className="sb-sidenav-footer">
                    <div className="small">Logged in as:</div>
                    {/* {user.displayName} */}
                </div>
            </nav>
        </div>

    );
}