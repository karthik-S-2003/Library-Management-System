import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGet, apiPost } from "../api";
import { getAuth } from "../auth";

// Helper for PUT request
async function apiPut(path, body, token) {
  const res = await fetch(`http://127.0.0.1:8081${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export default function Creator() {
  const auth = getAuth();
  const [data, setData] = useState(null);
  const [books, setBooks] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", author: "", price: 0, is_premium: false, content: "",theme:""
  });
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadMyBooks();
  }, []);

  async function loadMyBooks() {
    try {
      const res = await apiGet("/user/summary", auth?.access_token);
      setData(res);
      setBooks(res.books || []);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  function openCreateModal() {
    setEditingBook(null);
    setFormData({ title: "", author: auth?.name || "", price: 0, is_premium: false, content: "" });
    setMsg({ type: "", text: "" });
    setIsModalOpen(true);
  }

  function openEditModal(book) {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price,
      is_premium: book.is_premium,
      content: book.content
    });
    setMsg({ type: "", text: "" });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const payload = {
        title: formData.title,
        author: formData.author,
        content: formData.content,
        price: formData.is_premium ? parseFloat(formData.price) : 0,
        is_premium: formData.is_premium
      };

      if (editingBook) {
        await apiPut(`/user/books/${editingBook.id}`, payload, auth?.access_token);
        setMsg({ type: "success", text: "Book updated! Sent for re-approval." });
      } else {
        await apiPost("/user/books/", payload, auth?.access_token);
        setMsg({ type: "success", text: "Book created successfully!" });
      }
      
      await loadMyBooks();
      setTimeout(() => setIsModalOpen(false), 1500);

    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }
    async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const payload = {
        title: formData.title,
        author: formData.author,
        content: formData.content,
        price: formData.is_premium ? parseFloat(formData.price) : 0,
        is_premium: formData.is_premium,
        theme: formData.theme // <--- ADD THIS LINE
      };

      if (editingBook) {
        await apiPut(`/user/books/${editingBook.id}`, payload, auth?.access_token);
        setMsg({ type: "success", text: "Book updated! Sent for re-approval." });
      } else {
        await apiPost("/user/books/", payload, auth?.access_token);
        setMsg({ type: "success", text: "Book created successfully!" });
      }
      
      await loadMyBooks();
      setTimeout(() => setIsModalOpen(false), 1500);

    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <Navbar />
      <div style={styles.container}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={{margin: 0}}>Creator Studio</h2>
            <p style={{color: "#666", margin: "5px 0 0"}}>Manage your writings and publish to the world.</p>
          </div>
          <button style={styles.createBtn} onClick={openCreateModal}>
            + Write New Book
          </button>
        </div>

        {/* STATS CARDS */}
        {data && (
          <div style={styles.statsRow}>
            <StatCard label="Total Books" value={data.stats.total} color="#2196f3" />
            <StatCard label="Approved" value={data.stats.approved} color="#4caf50" />
            <StatCard label="Pending" value={data.stats.pending} color="#ff9800" />
            <StatCard label="Rejected" value={data.stats.rejected} color="#f44336" />
          </div>
        )}

        <hr style={styles.divider} />

        {/* BOOK GRID */}
        <h3 style={{color: "#333", marginBottom: "20px"}}>My Books</h3>
        
        {books.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{fontSize: "50px", marginBottom: "10px"}}>📚</div>
            <p>You haven't created any books yet.</p>
            <p style={{fontSize: "14px", color: "#999"}}>Click "Write New Book" to get started!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {books.map(book => (
              <div key={book.id} style={styles.card} onClick={() => openEditModal(book)}>
                <div style={styles.statusBadge(book.status)}>
                  {book.status.toUpperCase()}
                </div>
                <h4 style={styles.bookTitle}>{book.title}</h4>
                <p style={styles.bookAuthor}>by {book.author}</p>
                <div style={styles.bookMeta}>
                  <span>{book.is_premium ? `Premium (₹${book.price})` : "Free"}</span>
                  <span>•</span>
                  <span>{book.content.split(' ').length} words</span>
                </div>
                <p style={styles.preview}>
                  {book.content.substring(0, 120)}...
                </p>
                <div style={styles.cardHoverText}>✏️ Click to Edit</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>{editingBook ? "Edit Book" : "Write New Book"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>✖</button>
            </div>

            {msg.text && (
              <div style={{
                ...styles.msgBox, 
                background: msg.type === "error" ? "#ffebee" : "#e8f5e9", 
                color: msg.type === "error" ? "#c62828" : "#2e7d32"
              }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Title</label>
                  <input 
                    required
                    style={styles.input} 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter book title"
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Author Name</label>
                  <input 
                    required
                    style={styles.input} 
                    value={formData.author} 
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    placeholder="Your pen name"
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Theme</label>
                  <input 
                    style={styles.input} 
                    value={formData.theme} 
                    onChange={e => setFormData({...formData, theme: e.target.value})}
                    placeholder="Book Theme (e.g. Sci-Fi)" 
                  />

                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                  <input 
                    type="checkbox" 
                    id="is_premium"
                    checked={formData.is_premium} 
                    onChange={e => setFormData({...formData, is_premium: e.target.checked})}
                    style={{width: "18px", height: "18px", cursor: "pointer"}}
                  />
                  <label htmlFor="is_premium" style={{fontSize: "14px", cursor: "pointer", fontWeight: "500"}}>
                    Is Premium?
                  </label>
                </div>
                
                {formData.is_premium && (
                  <div style={{flex: 1}}>
                     <label style={styles.label}>Price (₹)</label>
                     <input 
                      type="number"
                      required
                      min="1"
                      style={styles.input} 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="99"
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={styles.label}>Content / Story</label>
                <textarea 
                  required
                  style={styles.textarea} 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Start writing your story here... You can write as many words as you want."
                />
                <div style={{fontSize: "12px", color: "#999", marginTop: "5px"}}>
                  Word count: {formData.content.split(/\s+/).filter(w => w).length}
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? "Saving..." : (editingBook ? "Update Book" : "Publish Book")}
              </button>
            
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{...styles.statCard, borderTop: `4px solid ${color}`}}>
      <div style={{fontSize: "28px", fontWeight: "bold", color: "#333"}}>{value}</div>
      <div style={{fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "5px"}}>
        {label}
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { maxWidth: "1100px", margin: "0 auto", padding: "30px 20px", fontFamily: "sans-serif" },
  
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" },
  createBtn: { 
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
    color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", 
    cursor: "pointer", fontWeight: "bold", fontSize: "14px", boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },
  
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px", marginBottom: "30px" },
  statCard: { 
    background: "white", padding: "25px 20px", borderRadius: "10px", 
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center", border: "1px solid #f0f0f0" 
  },
  
  divider: { border: "none", borderTop: "1px solid #eee", margin: "30px 0" },
  
  emptyState: { 
    textAlign: "center", padding: "60px 20px", color: "#999", 
    border: "2px dashed #ddd", borderRadius: "12px", background: "#fafafa" 
  },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  card: { 
    background: "white", border: "1px solid #e0e0e0", borderRadius: "12px", 
    padding: "24px", position: "relative", cursor: "pointer", 
    transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  
  statusBadge: (status) => ({
    position: "absolute", top: "15px", right: "15px", 
    background: status === "approved" ? "#e8f5e9" : status === "rejected" ? "#ffebee" : "#fff3e0",
    color: status === "approved" ? "#2e7d32" : status === "rejected" ? "#c62828" : "#ef6c00",
    fontSize: "10px", fontWeight: "bold", padding: "5px 10px", borderRadius: "12px", 
    textTransform: "uppercase", letterSpacing: "0.5px"
  }),
  
  bookTitle: { margin: "0 60px 5px 0", fontSize: "19px", color: "#2c3e50", fontWeight: "600" },
  bookAuthor: { margin: "0 0 12px 0", fontSize: "13px", color: "#95a5a6", fontStyle: "italic" },
  bookMeta: { display: "flex", gap: "10px", fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", alignItems: "center" },
  preview: { fontSize: "14px", color: "#555", lineHeight: "1.6", marginBottom: "15px", minHeight: "60px" },
  cardHoverText: { fontSize: "13px", color: "#667eea", fontWeight: "600", textAlign: "right" },
  
  modalOverlay: { 
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", 
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
    backdropFilter: "blur(3px)"
  },
  modalContent: { 
    background: "white", width: "90%", maxWidth: "650px", borderRadius: "16px", 
    padding: "35px", maxHeight: "90vh", overflowY: "auto", 
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)" 
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  closeBtn: { background: "transparent", border: "none", fontSize: "22px", cursor: "pointer", color: "#999" },
  
  form: { display: "flex", flexDirection: "column", gap: "22px" },
  formRow: { display: "flex", gap: "20px", alignItems: "end" },
  label: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#131212" },
  input: { 
    width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #ddd", 
    fontSize: "14px", transition: "border 0.2s", boxSizing: "border-box",background:"#dbd8d8",color:"#121111"
  },
  textarea: { 
    width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #ddd", 
    fontSize: "14px", minHeight: "180px", resize: "vertical", lineHeight: "1.6",
    fontFamily: "inherit", boxSizing: "border-box",background:"#dbd8d8",color:"#121111"
  },
  
  submitBtn: { 
    padding: "14px", background: "#667eea", color: "white", border: "none", 
    borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px",
    fontSize: "15px", boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },
  msgBox: { 
    padding: "12px", borderRadius: "8px", marginBottom: "20px", 
    fontSize: "14px", textAlign: "center", fontWeight: "500" 
  }
};
