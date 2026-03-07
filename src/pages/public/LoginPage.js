import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Cek apakah user sudah punya role
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Jika belum ada, tambahkan sebagai user biasa
        await setDoc(userRef, {
          email: user.email,
          role: "user", // Default role: user
          membership: "Essential", // Default membership
        });
      }

      navigate("/");
    } catch (error) {
      console.error("Login gagal:", error.message);
    }
  };

  return (
    <section className="page-section cta">
      <div className="container">
        <div className="row">
          <div className="col-xl-9 mx-auto">
            <div className="cta-inner bg-faded text-center rounded">
              <h2 className="section-heading mb-4">
                <span className="section-heading-upper">One More Step</span>
                <span className="section-heading-lower">LOGIN</span>
              </h2>
              <p>Silakan login menggunakan akun Google</p>
              <button className="btn btn-gold" onClick={handleGoogleLogin}>
                Login dengan Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
