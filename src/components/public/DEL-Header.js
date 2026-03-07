import { useContext } from "react";
import { AuthContext } from "../AuthContext";

const Header = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        {user && (
          <span className="badge bg-light text-dark">
            👤 {user.displayName}
          </span>
        )}
      </div>

      
    </div>
  );
};
