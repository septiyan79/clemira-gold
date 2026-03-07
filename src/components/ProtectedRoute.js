import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-5">Memuat autentikasi...</p>;

  // Jika tidak login
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user) {
    return (
      <div className="text-center mt-5 text-danger">
        <h4>Anda belum login.</h4>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <section className="page-section cta">
        <div className="container">
          <div className="row">
            <div className="col-xl-9 mx-auto">
              <div className="cta-inner bg-faded text-center rounded">
                <div className="text-center mt-5">
                  <h3>🚫 Anda tidak memiliki akses ke halaman ini.</h3>
                  <p>Silakan kembali ke <a href="/">halaman utama</a>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return children;
};

export default ProtectedRoute;
