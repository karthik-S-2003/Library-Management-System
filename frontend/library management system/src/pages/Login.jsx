import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiLogin } from "../api";
import { saveAuth } from "../auth";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    console.log("Logging in...");
    try {
      const data = await apiLogin(username, password);
      console.log("Login success:", data);
      saveAuth(data);
      
      // Navigate based on role
      if (data.role === "admin") nav("/admin");
      else if (data.role === "creator") nav("/creator");
      else if (data.role === "user") nav("/user");
      else nav("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        <p style={styles.subtitle}>Enter your credentials to access the library</p>
        
        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>User ID or Name</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter your user ID or name"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password" 
              type="password"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px"
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    width: "100%",
    maxWidth: "400px"
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    color: "#333",
    textAlign: "center"
  },
  subtitle: {
    margin: "0 0 30px 0",
    fontSize: "14px",
    color: "#666",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333"
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    transition: "border 0.3s",
    background:"#dbd8d8",
    color:"black"
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.2s",
    marginTop: "10px"
  },
  error: {
    background: "#ffebee",
    color: "#c62828",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "20px",
    textAlign: "center",
    fontSize: "14px"
  },
  footer: {
    marginTop: "30px",
    textAlign: "center"
  },
  footerText: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 10px 0"
  },
  link: {
    color: "#667eea",
    fontWeight: "bold",
    textDecoration: "none"
  },
  hintText: {
    fontSize: "12px",
    color: "#999",
    margin: "0"
  }
};
