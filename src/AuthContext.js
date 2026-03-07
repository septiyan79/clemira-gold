import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        console.log("Firestore doc check:", userSnap.exists());

        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log("User data from Firestore:", userData);

          setUser({
            ...currentUser,
            role: userData.role || "user",
            membership: userData.membership || "Essential",
          });
        } else {
          console.log("Firestore doc not found, fallback user");

          setUser({
            ...currentUser,
            role: "user",
            membership: "Essential",
          });
        }
      } else {
        console.log("No Firebase Auth user, setting user = null");
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
