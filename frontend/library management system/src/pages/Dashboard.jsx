import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGet } from "../api";
import { getAuth } from "../auth";

export default function Dashboard() {
  const auth = getAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await apiGet("/user/dashboard", auth?.access_token);
      
      setData({
        ...res,
        // Safety checks for all array/number fields
        recent_reading: res.recent_reading || [], 
        purchased_books: res.purchased_books || [],
        total_reading_seconds: res.total_reading_seconds || 0,
        today_reading_seconds: res.today_reading_seconds || 0, // <--- New field for Daily Goal
        total_purchased: res.total_purchased || 0,
        total_viewed: res.total_viewed || 0,
      });
    } catch (e) {
      setErr(e.message);
    }
  }

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return "0s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "In Progress"; 
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>📊 My Dashboard</h2>
          <p>Welcome back, <b>{data?.name || auth?.name || auth?.username}</b>!</p>
        </div>

        {err && <div style={styles.error}>{err}</div>}

        {data ? (
          <div style={styles.gridContainer}>
            
            {/* --- TOP STATS CARDS --- */}
            <div style={styles.statsRow}>
              <div style={{...styles.statCard, borderTop: "4px solid #4caf50"}}>
                <div style={styles.statIcon}>📚</div>
                <h3 style={styles.statNumber}>{data.total_purchased}</h3>
                <p style={styles.statLabel}>Purchased</p>
              </div>

              <div style={{...styles.statCard, borderTop: "4px solid #2196f3"}}>
                <div style={styles.statIcon}>👁️</div>
                <h3 style={styles.statNumber}>{data.total_viewed}</h3>
                <p style={styles.statLabel}>Books Opened</p>
              </div>

              <div style={{...styles.statCard, borderTop: "4px solid #ff9800"}}>
                <div style={styles.statIcon}>⏱️</div>
                <h3 style={styles.statNumber}>{formatDuration(data.total_reading_seconds)}</h3>
                <p style={styles.statLabel}>Total Reading Time</p>
              </div>
            </div>

            {/* --- DAILY READING GOAL --- */}
            <div style={styles.section}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
                <h3 style={{...styles.sectionTitle, margin: 0, border: "none"}}>🎯 Daily Reading Goal</h3>
                <span style={{fontSize: "13px", color: "#666", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px"}}>
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div style={styles.progressContainer}>
                <div style={styles.progressInfo}>
                  <span>Target: 30 minutes</span>
                  <span style={{fontWeight: "bold", color: "#2563eb"}}>
                    {formatDuration(data.today_reading_seconds)} / 30m
                  </span>
                </div>
                
                <div style={styles.progressBarBg}>
                  <div 
                    style={{
                      ...styles.progressBarFill, 
                      // Calculate percentage based on TODAY's reading time only
                      width: `${Math.min((data.today_reading_seconds / 1800) * 100, 100)}%`,
                      background: data.today_reading_seconds >= 1800 ? "#22c55e" : "#2563eb"
                    }}
                  />
                </div>
                
                <p style={{marginTop: "10px", fontSize: "13px", color: "#666"}}>
                  {data.today_reading_seconds >= 1800 
                    ? "🎉 Goal achieved! Excellent work today." 
                    : `Read for ${formatDuration(Math.max(0, 1800 - data.today_reading_seconds))} more to reach your daily goal.`}
                </p>
              </div>
            </div>

            {/* --- RECENT ACTIVITY --- */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📖 Recent Reading Activity</h3>
              
              {(!data.recent_reading || data.recent_reading.length === 0) ? (
                <div style={styles.emptyState}>
                  <p style={{fontSize: "40px", margin: "0"}}>⏳</p>
                  <p style={{color: "#888", marginTop: "10px"}}>
                    No activity yet. Go to your Library and click "Read"!
                  </p>
                </div>
              ) : (
                <div style={styles.readingList}>
                  {data.recent_reading.map((item, index) => (
                    <div key={index} style={styles.readingCard}>
                      <div style={styles.readingCardLeft}>
                        <div style={styles.bookIconLarge}>📖</div>
                        <div>
                          <h4 style={styles.readingBookTitle}>{item.title}</h4>
                          <p style={styles.readingBookAuthor}>by {item.author}</p>
                          <p style={styles.readingTime}>
                            ⏱️ {formatDuration(item.duration_seconds)}
                          </p>
                        </div>
                      </div>
                      <div style={styles.readingCardRight}>
                        <span style={{
                            ...styles.dateText, 
                            color: item.ended_at ? "#666" : "#2e7d32",
                            fontWeight: item.ended_at ? "normal" : "bold"
                        }}>
                            {formatDate(item.ended_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

             {/* --- PURCHASED BOOKS --- */}
             <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💰 My Purchased Books</h3>
              
              {(!data.purchased_books || data.purchased_books.length === 0) ? (
                <div style={{padding: "20px", color: "#888", fontStyle: "italic"}}>
                  You haven't purchased any premium books yet.
                </div>
              ) : (
                <div style={styles.purchasedList}>
                  {data.purchased_books.map((book) => (
                    <div key={book.id} style={styles.miniBookCard}>
                        <span style={{fontSize: "20px"}}>📕</span>
                        <div>
                            <div style={{fontWeight: "600", color: "#333"}}>{book.title}</div>
                            <div style={{fontSize: "12px", color: "#666"}}>₹{book.price}</div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
            <div style={{textAlign: "center", padding: "40px", color: "#666"}}>Loading dashboard...</div>
        )}
      </div>
    </>
  );
}

// --- STYLES ---
const styles = {
  container: { maxWidth: "1000px", margin: "0 auto", padding: "30px 20px", fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" },
  header: { marginBottom: "30px", textAlign: "center" },
  
  error: { background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "20px", textAlign: "center" },

  gridContainer: { display: "flex", flexDirection: "column", gap: "30px" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  statCard: { background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  statIcon: { fontSize: "32px", marginBottom: "10px" },
  statNumber: { fontSize: "28px", fontWeight: "800", margin: "0", color: "#333" },
  statLabel: { fontSize: "13px", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "5px" },

  section: { background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" },
  sectionTitle: { margin: "0 0 20px 0", fontSize: "18px", color: "#2c3e50", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" },

  // Progress Bar Styles
  progressContainer: { marginTop: "10px" },
  progressInfo: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#444" },
  progressBarBg: { width: "100%", height: "12px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" },
  progressBarFill: { height: "100%", transition: "width 0.5s ease-in-out", borderRadius: "6px" },

  emptyState: { textAlign: "center", padding: "30px", color: "#aaa", border: "2px dashed #eee", borderRadius: "8px" },

  readingList: { display: "flex", flexDirection: "column", gap: "15px" },
  readingCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "8px", border: "1px solid #f1f5f9", transition: "background 0.2s" },
  readingCardLeft: { display: "flex", gap: "15px", alignItems: "center" },
  bookIconLarge: { fontSize: "24px", background: "#f8fafc", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" },
  readingBookTitle: { margin: "0 0 4px 0", fontSize: "16px", color: "#333" },
  readingBookAuthor: { margin: "0 0 4px 0", fontSize: "13px", color: "#888" },
  readingTime: { margin: "0", fontSize: "12px", color: "#2563eb", fontWeight: "600" },
  dateText: { fontSize: "13px" },

  purchasedList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" },
  miniBookCard: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #eee", background: "#fafafa" }
};
