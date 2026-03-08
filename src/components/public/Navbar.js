import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        }
      }
    };
    fetchRole();
  }, [user]);

  // Styling default
  const linkClass = ({ isActive }) =>
    `nav-link text-uppercase ${
      isActive ? "fw-bold text-light active-link disabled" : "text-muted"
    }`;

  // Custom cek active untuk menu Price
  const isPriceActive = [
    "/price",
    "/input-harga",
    "/monthly-price",
    "/yearly-price",
  ].some((path) => location.pathname.startsWith(path));

  return (
    <>
      <header>
        <h1 className="site-heading text-center text-faded d-none d-lg-block">
          <span className="site-heading-upper text-gold mb-3">
            Emasmu Kendalimu
          </span>
          <span className="site-heading-lower">CLEMIRA GOLD</span>
        </h1>
      </header>

      <nav
        className="navbar navbar-expand-lg navbar-dark py-lg-4 sticky-nav"
        id="mainNav"
      >
        <div className="container">
          {/* Logo kiri */}
          <a className="navbar-brand d-flex align-items-center" href="/">
            <span className="fw-bold text-uppercase">Clemira Gold</span>
          </a>

          {/* Toggle mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto">
              <li className="nav-item px-lg-2">
                <NavLink to="/" className={linkClass}>
                  Home
                </NavLink>
              </li>

              {/* 👉 Custom Price */}
              <li className="nav-item px-lg-2">
                <NavLink
                  to="/price"
                  className={`nav-link text-uppercase ${
                    isPriceActive
                      ? "fw-bold text-light active-link disabled"
                      : "text-muted"
                  }`}
                >
                  Price
                </NavLink>
              </li>

              <li className="nav-item px-lg-2">
                <NavLink to="/sale" className={linkClass}>
                  Sale
                </NavLink>
              </li>
              <li className="nav-item px-lg-2">
                <NavLink to="/about" className={linkClass}>
                  About
                </NavLink>
              </li>
            </ul>

            {/* Login / User dropdown */}
            <div className="mt-3 mt-lg-0 ms-0 ms-lg-auto text-start text-lg-end">
              {!user ? (
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-outline-light btn-sm text-uppercase"
                >
                  Login
                </button>
              ) : (
                <div className="dropdown">
                  <button
                    className="btn btn-sm text-light dropdown-toggle text-uppercase"
                    style={{ background: "transparent", border: "none" }}
                    type="button"
                    id="userMenu"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    👤 {user.displayName}
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    aria-labelledby="userMenu"
                  >
                    {/* <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/profile")}
                      >
                        Profile
                      </button>
                    </li> */}
                    {role === "admin" && (
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => navigate("/nadmin")}
                        >
                          Admin Page
                        </button>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => signOut(auth)}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <style>
        {`
          .nav-link {
            position: relative;
            transition: all 0.3s ease;
          }
          .nav-link.text-muted {
            opacity: 0.6;
          }
          .nav-link.active-link {
            opacity: 1 !important;
            cursor: default;
            pointer-events: none;
          }

          /* Garis bawah */
          .nav-link.active-link::after {
            content: "";
            position: absolute;
            bottom: -4px;
            height: 3px;
            border-radius: 2px;
            background-color: #FFD700;
            animation: underlineIn 0.3s ease forwards;
          }

          /* Desktop → garis pendek di tengah */
          @media (min-width: 992px) {
            .nav-link.active-link::after {
              left: 50%;
              transform: translateX(-50%);
              width: 18px;
            }
          }

          /* Mobile → full lebar teks */
          @media (max-width: 991px) {
            .nav-link.active-link::after {
              left: 0;
              transform: none;
              width: 100%;
            }
          }

          @keyframes underlineIn {
            from {
              width: 0;
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
}
