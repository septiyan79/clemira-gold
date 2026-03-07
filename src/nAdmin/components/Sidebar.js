export default function Sidebar() {
  // fungsi toggle untuk menu bertipe "has-arrow"
  const handleToggle = (e) => {
    e.preventDefault();
    const parent = e.currentTarget.closest(".sidebar-item");
    const submenu = parent.querySelector(".first-level");

    if (submenu) {
      submenu.classList.toggle("collapse");
    }
  };

  return (
    <aside className="left-sidebar">
      {/* Sidebar scroll */}
      <div className="scroll-sidebar">
        {/* Sidebar navigation */}
        <nav className="sidebar-nav">
          <ul id="sidebarnav">
            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">Home</span>
            </li>

            {/* === Dashboard Menu === */}
            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin"
                aria-expanded="false"
              >
                <i className="mdi mdi-av-timer"></i>
                <span className="hide-menu">Dashboard</span>
              </a>
            </li>

            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">Sale</span>
            </li>

            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin/Products"
                aria-expanded="false"
              >
                <i className="mdi mdi-camera"></i>
                <span className="hide-menu">List of Product</span>
              </a>
            </li>

            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">Antam Price</span>
            </li>

            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin/AmPriceDaily"
                aria-expanded="false"
              >
                <i className="mdi mdi-cash"></i>
                <span className="hide-menu">Antam Price - Daily</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin/AmPriceMonthly"
                aria-expanded="false"
              >
                <i className="mdi mdi-cash"></i>
                <span className="hide-menu">Antam Price - Monthly</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin/AmPriceYearly"
                aria-expanded="false"
              >
                <i className="mdi mdi-cash"></i>
                <span className="hide-menu">Antam Price - Yearly</span>
              </a>
            </li>

            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">User</span>
            </li>

            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="/nadmin/users"
                aria-expanded="false"
              >
                <i className="mdi mdi-account-circle"></i>
                <span className="hide-menu">User Management</span>
              </a>
            </li>


            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">======================</span>
            </li>


            <li className="sidebar-item">
              <a
                href="#"
                className="sidebar-link has-arrow waves-effect waves-dark"
                onClick={handleToggle}
                aria-expanded="false"
              >
                <i className="mdi mdi-av-timer"></i>
                <span className="hide-menu">Dashboard</span>
                <span className="badge badge-pill badge-info ml-auto m-r-15">3</span>
              </a>

              <ul aria-expanded="false" className="first-level collapse">
                <li className="sidebar-item">
                  <a href="index.html" className="sidebar-link">
                    <i className="mdi mdi-adjust"></i>
                    <span className="hide-menu">Classic</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a href="index2.html" className="sidebar-link">
                    <i className="mdi mdi-adjust"></i>
                    <span className="hide-menu">Analytical</span>
                  </a>
                </li>
                <li className="sidebar-item">
                  <a href="index3.html" className="sidebar-link">
                    <i className="mdi mdi-adjust"></i>
                    <span className="hide-menu">Modern</span>
                  </a>
                </li>
              </ul>
            </li>

            {/* === Extra === */}
            <li className="nav-small-cap">
              <i className="mdi mdi-dots-horizontal"></i>
              <span className="hide-menu">Extra</span>
            </li>

            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="../../docs/documentation.html"
                aria-expanded="false"
              >
                <i className="mdi mdi-content-paste"></i>
                <span className="hide-menu">Documentation</span>
              </a>
            </li>

            <li className="sidebar-item">
              <a
                className="sidebar-link waves-effect waves-dark sidebar-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Log out clicked");
                }}
                aria-expanded="false"
              >
                <i className="mdi mdi-directions"></i>
                <span className="hide-menu">Log Out</span>
              </a>
            </li>
          </ul>
        </nav>
        {/* End Sidebar navigation */}
      </div>
      {/* End Sidebar scroll */}
    </aside>
  );
}
