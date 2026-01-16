import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRegister } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      await apiRegister(formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => nav("/login"), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "48px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2 style={{ textAlign: "center" }}>Register New User?</h2>
      
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        
        <div>
          <label>Full Name</label>
          <input 
            name="name" 
            required 
            placeholder="Enter your full name" 
            value={formData.name} 
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 5 ,background:"#fffdfd",color:"#121111"}}
          />
        </div>

        <div>
          <label>Email</label>
          <input 
            name="email" 
            type="email" 
            required 
            placeholder="john@example.com" 
            value={formData.email} 
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 5 ,background:"#fffdfd",color:"#121111"}}
          />
        </div>

        <div>
          <label>Phone Number</label>
          <input 
            name="phone_number" 
            required 
            placeholder="9876543210" 
            value={formData.phone_number} 
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 5 ,background:"#fffdfd",color:"#121111"}}
          />
        </div>

        <div>
          <label>Password</label>
          <input 
            name="password" 
            type="password" 
            required 
            placeholder="******" 
            value={formData.password} 
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 5 ,background:"#fffdfd",color:"#121111"}}
          />
        </div>

        <button type="submit" style={{ padding: 10, background: "#007bff", color: "white", border: "none", cursor: "pointer" }}>
          Register
        </button>

      </form>

      {error && <p style={{ color: "crimson", textAlign: "center", marginTop: 10 }}>{error}</p>}
      {success && <p style={{ color: "green", textAlign: "center", marginTop: 10 }}>{success}</p>}

      <p style={{ textAlign: "center", marginTop: 20 }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

