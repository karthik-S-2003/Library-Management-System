import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGet, apiPost } from "../api";
import { getAuth } from "../auth";

// Helper for Delete (add to api.js or use locally)
async function apiDelete(path, token) {
  const res = await fetch(`http://127.0.0.1:8081${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export default function Admin() {
  const auth = getAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("books"); // 'books' or 'users'
  const [msg, setMsg] = useState(null);
  
  // Single Filter State
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const s = await apiGet("/admin/summary", auth?.access_token);
      setStats(s.stats);

      const u = await apiGet("/admin/users", auth?.access_token);
      setUsers(u);

      const b = await apiGet("/admin/books", auth?.access_token);
      // Sort: Pending first, then by ID
      b.sort((x, y) => (x.status === "pending" ? -1 : 1));
      setBooks(b);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAction(bookId, action) {
    setMsg(null);
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to permanently delete this book?")) return;
        await apiDelete(`/admin/books/${bookId}`, auth?.access_token);
        setMsg({ type: "success", text: "Book deleted." });
      } else {
        // Approve or Reject
        await apiPost(`/admin/books/${bookId}/${action}`, {}, auth?.access_token);
        setMsg({ type: "success", text: `Book ${action}ed!` });
      }
      loadAll(); // Refresh data
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  // Filter Logic: Single Search Term
  const filteredBooks = books.filter(book => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      (book.theme || "").toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={{margin: 0, color: "#1e293b"}}>Admin Dashboard</h2>
        </div>

        {/* STATS ROW */}
        {stats && (
          <div style={styles.statsGrid}>
            <StatCard label="Registered Users" value={stats.total_users} icon="👥" color="#3b82f6" />
            <StatCard label="Pending Approvals" value={stats.pending_books} icon="⏳" color="#f59e0b" />
            <StatCard label="Total Books" value={stats.total_books} icon="📚" color="#10b981" />
          </div>
        )}

        {/* TABS */}
        <div style={styles.tabs}>
          <button 
            style={activeTab === "books" ? styles.tabActive : styles.tab} 
            onClick={() => setActiveTab("books")}
          >
            📚 Book Management
          </button>
          <button 
            style={activeTab === "users" ? styles.tabActive : styles.tab} 
            onClick={() => setActiveTab("users")}
          >
            👥 User Registry
          </button>
        </div>

        {msg && (
          <div style={{
            ...styles.msgBox, 
            background: msg.type === "error" ? "#fee2e2" : "#dcfce7",
            color: msg.type === "error" ? "#b91c1c" : "#15803d"
          }}>
            {msg.text}
          </div>
        )}

        {/* CONTENT AREA */}
        <div style={styles.contentArea}>
          
          {/* --- BOOKS TABLE --- */}
          {activeTab === "books" && (
            <>
               {/* Search Bar placed inside content area */}
              <div style={{padding: "20px 20px 0 20px"}}>
                 <input 
                   style={styles.searchBar}
                   placeholder="🔍 Search Title, Author or Theme..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>

              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Author</th>
                    <th style={styles.th}>Theme</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.thAction}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id} style={styles.tr}>
                      <td style={styles.td}>#{book.id}</td>
                      <td style={{...styles.td, fontWeight: "600"}}>{book.title}</td>
                      <td style={styles.td}>{book.author}</td>
                      <td style={styles.td}>{book.theme || "-"}</td>
                      <td style={styles.td}>
                        {book.is_premium ? <span style={styles.badgePremium}>Premium</span> : "Free"}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={book.status} />
                      </td>
                      <td style={styles.tdAction}>
                        {book.status === "pending" && (
                          <>
                            <button style={styles.btnApprove} onClick={() => handleAction(book.id, "approve")}>✓</button>
                            <button style={styles.btnReject} onClick={() => handleAction(book.id, "reject")}>✗</button>
                          </>
                        )}
                        <button style={styles.btnDelete} onClick={() => handleAction(book.id, "delete")}>🗑</button>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr><td colSpan="7" style={styles.emptyTd}>No matching books found.</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* --- USERS TABLE --- */}
          {activeTab === "users" && (
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} style={styles.tr}>
                    <td style={{...styles.td, fontFamily: "monospace"}}>{user.user_id}</td>
                    <td style={{...styles.td, fontWeight: "600"}}>{user.name}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.phone_number}</td>
                    <td style={styles.td}>
                      <span style={styles.roleBadge}>{user.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </>
  );
}

// --- COMPONENTS ---
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{...styles.statCard, borderLeft: `5px solid ${color}`}}>
      <div style={{fontSize: "24px"}}>{icon}</div>
      <div>
        <div style={{fontSize: "24px", fontWeight: "bold", color: "#333"}}>{value}</div>
        <div style={{fontSize: "12px", color: "#666", textTransform: "uppercase"}}>{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    approved: { bg: "#dcfce7", text: "#166534" },
    pending: { bg: "#fef3c7", text: "#92400e" },
    rejected: { bg: "#fee2e2", text: "#b91c1c" }
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      background: c.bg, color: c.text, padding: "4px 8px", 
      borderRadius: "12px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
}

// --- STYLES ---
const styles = {
  container: { maxWidth: "1000px", margin: "0 auto", padding: "30px 20px", fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" },
  header: { marginBottom: "30px" },
  
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" },
  statCard: { background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "15px" },
  
  tabs: { display: "flex", gap: "10px", marginBottom: "20px" },
  tab: { padding: "10px 20px", border: "none", background: "#e2e8f0", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#64748b" },
  tabActive: { padding: "10px 20px", border: "none", background: "#1e293b", color: "white", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  
  contentArea: { background: "white", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflow: "hidden" },
  
  // New Search Bar Style
  searchBar: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", marginBottom: "15px", boxSizing: "border-box" ,background:"#d5d3d3",color:"#111111"},

  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  trHead: { background: "#f1f5f9", textAlign: "left" },
  th: { padding: "15px", color: "#475569", fontWeight: "600", borderBottom: "2px solid #e2e8f0" },
  thAction: { padding: "15px", color: "#475569", fontWeight: "600", borderBottom: "2px solid #e2e8f0", textAlign: "right" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "15px", color: "#334155" },
  tdAction: { padding: "15px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" },
  emptyTd: { padding: "30px", textAlign: "center", color: "#94a3b8" },
  
  btnApprove: { background: "#22c55e", color: "white", border: "none", width: "30px", height: "30px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  btnReject: { background: "#f59e0b", color: "white", border: "none", width: "30px", height: "30px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  btnDelete: { background: "#ef4444", color: "white", border: "none", width: "30px", height: "30px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  
  badgePremium: { background: "#e0f2fe", color: "#0284c7", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  roleBadge: { background: "#f3f4f6", color: "#4b5563", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", textTransform: "capitalize" },
  
  msgBox: { padding: "10px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px", fontWeight: "500", textAlign: "center" }
};
