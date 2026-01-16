import { Link, useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../auth";

export default function Navbar() {
  const auth = getAuth(); // { name, role, ... }
  const nav = useNavigate();

  function logout() {
    clearAuth();
    nav("/login");
  }
  const showGenericDashboard = auth?.role === "user";

  return (
    <div style={styles.nav}>
      <div style={styles.links}>
        
        {/* Only show 'Dashboard' for regular Users */}
        {showGenericDashboard && (
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        )}
        
        {/* Role-specific Links */}
        {auth?.role === "admin" && <Link to="/admin" style={styles.link}>Admin Panel</Link>}
        
        {auth?.role === "creator" && <Link to="/creator" style={styles.link}>Creator Studio</Link>}
        
        {auth?.role === "user" && <Link to="/user" style={styles.link}>Library</Link>}
      </div>

      <div style={styles.profile}>
        <span style={styles.userText}>
          Hello, <b>{auth?.name || auth?.username}</b> ({auth?.role})
        </span>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  links: { display: "flex", gap: "25px", alignItems: "center" },
  link: { 
    textDecoration: "none", 
    color: "#444", 
    fontWeight: "600", 
    fontSize: "15px",
    transition: "color 0.2s"
  },
  profile: { display: "flex", alignItems: "center", gap: "15px" },
  userText: { color: "#666", fontSize: "14px" },
  logoutBtn: {
    padding: "8px 16px",
    background: "#ffebee",
    color: "#c62828",
    border: "1px solid #ef9a9a",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600"
  }
};
