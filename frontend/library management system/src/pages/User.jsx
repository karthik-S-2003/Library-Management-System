import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGet, apiPost } from "../api";
import { getAuth } from "../auth";

const REMINDER_EVERY_SECONDS = 120; 

// --- COMMENT COMPONENT ---
const CommentNode = ({ comment, activeReplyId, setActiveReplyId, onReplySubmit, currentUser }) => {
  const [replyText, setReplyText] = useState("");
  const isMyComment = comment.user_name === currentUser;

  return (
    <div style={styles.commentBox}>
      <div style={styles.commentHeader}>
        <span style={styles.user}>
          {comment.user_name} {isMyComment && <span style={{color:"#666", fontWeight:"normal"}}>(You)</span>}
        </span>
        <span style={styles.date}>{new Date(comment.created_at).toLocaleDateString()}</span>
      </div>
      <p style={styles.text}>{comment.content}</p>
      
      {!isMyComment && (
        <button 
          style={styles.replyBtn} 
          onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
        >
          Reply
        </button>
      )}

      {activeReplyId === comment.id && !isMyComment && (
        <div style={styles.replyInputBox}>
          <input 
            style={styles.inputSmall} 
            placeholder={`Reply to ${comment.user_name}...`} 
            value={replyText} 
            onChange={e => setReplyText(e.target.value)} 
            autoFocus
          />
          <button 
            style={styles.btnSmall} 
            onClick={() => {
              onReplySubmit(comment.id, replyText);
              setReplyText(""); 
            }}
          >
            Send
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={styles.nestedBox}>
          {comment.replies.map(r => (
            <CommentNode 
              key={r.id} 
              comment={r} 
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              onReplySubmit={onReplySubmit}
              currentUser={currentUser} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN USER COMPONENT ---
export default function User() {
  const auth = getAuth();
  const [books, setBooks] = useState([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState([]); // Tracks what user owns
  const [readingBook, setReadingBook] = useState(null); 
  const [discussingBook, setDiscussingBook] = useState(null); 
  const [payingBook, setPayingBook] = useState(null);
  const [isPaying, setIsPaying] = useState(false); 
  
  // Single Filter State
  const [searchTerm, setSearchTerm] = useState("");

  // Comment System
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  const [popupInfo, setPopupInfo] = useState(null);
  const [error, setError] = useState("");

  // Timer
  const timerIdRef = useRef(null);
  const secondsRef = useRef(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reminderText, setReminderText] = useState("");

  useEffect(() => {
    loadBooks();
    loadPurchasedBooks(); // <--- CRITICAL: Fetch purchases on load
    return () => stopTimer();
  }, []);

  async function loadBooks() {
    try {
      const data = await apiGet("/user/books", auth?.access_token);
      setBooks(data);
    } catch (e) {
      setError(e.message);
    }
  }

  // Fetch list of books user has already bought
  async function loadPurchasedBooks() {
      try {
          const data = await apiGet("/user/dashboard", auth?.access_token);
          if (data && data.purchased_books) {
              // Extract IDs from the returned object list
              setPurchasedBookIds(data.purchased_books.map(b => b.id));
          }
      } catch (e) {
          console.error("Failed to load purchases", e);
      }
  }

  // --- FILTER LOGIC ---
  const filteredBooks = books.filter(book => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      (book.theme || "").toLowerCase().includes(term)
    );
  });

  // --- TIMER LOGIC ---
  function stopTimer() {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }

  function startTimer() {
    stopTimer();
    secondsRef.current = 0;
    setElapsedSeconds(0);
    setReminderText("");
    timerIdRef.current = setInterval(() => {
      secondsRef.current += 1;
      setElapsedSeconds(secondsRef.current);
      if (REMINDER_EVERY_SECONDS > 0 && secondsRef.current > 0 && secondsRef.current % REMINDER_EVERY_SECONDS === 0) {
        setReminderText(`Reminder: You’ve been reading for ${Math.floor(secondsRef.current / 60)} minutes.`);
        setTimeout(() => setReminderText(""), 5000);
      }
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  // --- ACTIONS ---
  async function openReader(bookId) {
    setError("");
    try {
      const data = await apiGet(`/user/books/${bookId}`, auth?.access_token);
      await apiPost(`/user/books/${bookId}/start`, {}, auth?.access_token);
      setReadingBook({ ...data, id: bookId });
      startTimer();
    } catch (e) {
      // If payment required (402), catch it here
      if (String(e.message).includes("Pay") || String(e.message).includes("Payment")) {
        const book = books.find((b) => b.id === bookId);
        if (book) handleBuyClick(book); 
        else setError(e.message);
      } else {
        setError(e.message);
      }
    }
  }

  const handleBuyClick = (book) => {
      // Check local state first
      if (purchasedBookIds.includes(book.id)) {
          setPopupInfo({ 
              title: "Already Paid", 
              message: `You have already purchased "${book.title}". Click Read!`, 
              icon: "ℹ️", 
              color: "#0288d1" 
          });
          return;
      }
      setPayingBook(book);
  };

  async function finishReading() {
    if (!readingBook) return;
    stopTimer();
    const finalSeconds = secondsRef.current;
    try {
      await apiPost(`/user/books/${readingBook.id}/stop`, { duration_seconds: finalSeconds }, auth?.access_token);
      setPopupInfo({ title: "Reading Complete!", message: `Saved ${formatTime(finalSeconds)}. Opening discussion...`, icon: "✅", color: "#2e7d32" });
      
      const bookToDiscuss = readingBook;
      setReadingBook(null); 
      setDiscussingBook(bookToDiscuss); 
      loadComments(bookToDiscuss.id); 
      setTimeout(() => setPopupInfo(null), 1500);
    } catch (e) {
      setError(e.message);
      setReadingBook(null);
    } finally {
      secondsRef.current = 0; setElapsedSeconds(0); setReminderText("");
    }
  }

  async function loadComments(bookId) {
    try {
      const data = await apiGet(`/comments/${bookId}`, auth?.access_token);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePostComment(parentId = null, content) {
    if (!content.trim()) return;
    try {
      await apiPost("/comments/", {
        book_id: discussingBook.id,
        content: content,
        parent_id: parentId
      }, auth?.access_token);
      
      if (!parentId) setNewComment(""); 
      setActiveReplyId(null);
      loadComments(discussingBook.id); 
    } catch (e) {
      alert(e.message);
    }
  }

  async function confirmPayment() {
    if (!payingBook || isPaying) return;

    if (purchasedBookIds.includes(payingBook.id)) {
        setPayingBook(null);
        setPopupInfo({ title: "Already Paid", message: "You already own this book.", icon: "ℹ️", color: "#0288d1" });
        return;
    }
    
    setIsPaying(true); 
    try {
      const res = await apiPost(`/user/books/${payingBook.id}/pay`, { amount: payingBook.price }, auth?.access_token);
      
      const title = payingBook.title;
      const bookId = payingBook.id;
      setPayingBook(null);

      // If success, update local state
      if (res.message === "Payment successful" || res.message.toLowerCase().includes("success")) {
        setPurchasedBookIds(prev => [...prev, bookId]); 
        setPopupInfo({ title: "Payment successful", message: `You can now read "${title}".`, icon: "✅", color: "#2e7d32" });
      } else {
        setPopupInfo({ title: "Already Paid", message: res.message, icon: "ℹ️", color: "#0288d1" });
      }
    } catch (e) {
      // Handle "Already purchased" from backend
      if (String(e.message).toLowerCase().includes("already")) {
         setPurchasedBookIds(prev => [...prev, payingBook.id]); 
         setPayingBook(null);
         setPopupInfo({ title: "Already Paid", message: "You have already purchased this book.", icon: "ℹ️", color: "#0288d1" });
      } else {
         setError(e.message);
         setPayingBook(null);
      }
    } finally {
      setIsPaying(false); 
    }
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Library</h2>
          <p style={{ margin: "6px 0 0", color: "#666" }}>Read. Learn. Discuss.</p>
        </div>

        {/* --- SEARCH FILTER --- */}
        <div style={styles.searchContainer}>
           <input 
              style={styles.searchBar}
              placeholder="🔍 Search Title, Author, or Theme..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
           />
        </div>

        {error && <div style={styles.error}>{error}</div>}
        
        <div style={styles.grid}>
          {filteredBooks.map((book) => {
            const isBought = purchasedBookIds.includes(book.id);

            return (
            <div key={book.id} style={styles.card}>
              {book.is_premium && <span style={styles.badge}>PREMIUM</span>}
              <h3 style={styles.bookTitle}>{book.title}</h3>
              <p style={styles.author}>by {book.author}</p>
              <p style={styles.theme}>Theme: {book.theme || "General"}</p>
              <div style={styles.footer}>
                <span style={styles.price}>{book.is_premium ? `₹${book.price}` : "FREE"}</span>
                <div style={styles.actions}>
                  <button style={styles.readBtn} onClick={() => openReader(book.id)}>Read</button>
                  
                  {book.is_premium && !isBought && (
                      <button style={styles.buyBtn} onClick={() => handleBuyClick(book)}>Buy</button>
                  )}
                  {book.is_premium && isBought && (
                      <span style={{color: "green", fontWeight: "bold", fontSize: 13, alignSelf:"center"}}>Owned</span>
                  )}

                </div>
              </div>
            </div>
            );
          })}
          {filteredBooks.length === 0 && (
             <div style={{gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#888"}}>
                No books match your search.
             </div>
          )}
        </div>
      </div>

      {readingBook && (
        <div style={styles.modalOverlay}>
          <div style={styles.readerModal}>
            <div style={styles.readerTop}>
              <h2 style={{ margin: 0 }}>{readingBook.title}</h2>
              <div style={styles.timerPill}>⏱️ {formatTime(elapsedSeconds)}</div>
            </div>
            {reminderText && <div style={styles.reminder}>{reminderText}</div>}
            <div style={styles.readerBody}>
              <p style={styles.content}>{readingBook.content}</p>
            </div>
            <button style={styles.finishBtn} onClick={finishReading}>Finish Reading & Discuss</button>
          </div>
        </div>
      )}

      {discussingBook && (
        <div style={styles.modalOverlay}>
          <div style={styles.readerModal}>
            <div style={styles.readerTop}>
              <h2 style={{ margin: 0 }}>Discussion: {discussingBook.title}</h2>
              <button style={styles.closeBtn} onClick={() => setDiscussingBook(null)}>✖ Close</button>
            </div>
            <div style={styles.readerBody}>
               <div style={styles.discussionInputArea}>
                  <textarea 
                    style={styles.mainTextArea} 
                    placeholder="What did you think about this book?"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <button style={styles.btnMain} onClick={() => handlePostComment(null, newComment)}>Post Comment</button>
               </div>
               <h4 style={{marginBottom:10, color:"#444"}}>Comments ({comments.length})</h4>
               {comments.map(c => (
                 <CommentNode 
                   key={c.id} 
                   comment={c} 
                   activeReplyId={activeReplyId}
                   setActiveReplyId={setActiveReplyId}
                   onReplySubmit={handlePostComment}
                   currentUser={auth?.name} 
                 />
               ))}
               {comments.length === 0 && <p style={{color:"#888", fontStyle:"italic"}}>No comments yet. Be the first!</p>}
            </div>
          </div>
        </div>
      )}

      {payingBook && (
        <div style={styles.modalOverlay}>
          <div style={styles.paymentCard}>
            <button style={styles.closeIconBtn} onClick={() => setPayingBook(null)}>✖</button>
            <h3>Confirm Payment</h3>
            <p>Purchase <b>{payingBook.title}</b>?</p>
            <div style={styles.payAmount}>₹{payingBook.price}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={styles.cancelBtn} onClick={() => setPayingBook(null)}>Cancel</button>
              <button 
                style={{...styles.payBtn, opacity: isPaying ? 0.7 : 1, cursor: isPaying ? "wait" : "pointer"}} 
                onClick={confirmPayment} 
                disabled={isPaying}
              >
                {isPaying ? "Paying..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popupInfo && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.popupCard, borderTop: `5px solid ${popupInfo.color}`, position: 'relative' }}>
             <button style={styles.closeIconBtn} onClick={() => setPopupInfo(null)}>✖</button>
            <div style={{ fontSize: 30 }}>{popupInfo.icon}</div>
            <h3 style={{ color: popupInfo.color }}>{popupInfo.title}</h3>
            <p>{popupInfo.message}</p>
            <button style={styles.okBtn} onClick={() => setPopupInfo(null)}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  container: { width: "100%", padding: 40, fontFamily: "sans-serif", boxSizing: "border-box" },
  header: { textAlign: "center", marginBottom: 24 },
  
  // Search Container & Bar
  searchContainer: { maxWidth: 600, margin: "0 auto 30px auto" },
  searchBar: { width: "100%", padding: "14px 20px", borderRadius: "30px", border: "1px solid #ddd", fontSize: "16px", outline: "none", boxShadow: "0 2px 10px rgba(52, 51, 51, 0.05)",background:"#c9c7c7" ,color:"#000000"},

  error: { background: "#ffebee", color: "#c62828", padding: 10, borderRadius: 6, marginBottom: 16, textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card: { border: "1px solid #ddd", borderRadius: 10, padding: 18, background: "white", position: "relative", display: "flex", flexDirection: "column" },
  badge: { position: "absolute", top: 10, right: 10, background: "#ff9800", color: "white", fontSize: 10, padding: "4px 8px", borderRadius: 12, fontWeight: 700 },
  bookTitle: { margin: "0 0 6px 0", fontSize: 18 },
  author: { margin: "0 0 12px 0", color: "#666", fontSize: 13 },
  theme: { fontSize: "12px", background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, width: "fit-content", marginBottom: 10 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" },
  price: { fontWeight: 700, color: "#2c3e50" },
  actions: { display: "flex", gap: 8 },
  readBtn: { background: "#2196f3", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 700 },
  buyBtn: { background: "#4caf50", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 700 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  readerModal: { width: "90%", maxWidth: 900, height: "85vh", background: "white", borderRadius: 12, padding: 25, display: "flex", flexDirection: "column" },
  readerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  timerPill: { background: "#f1f1f1", padding: "6px 12px", borderRadius: 999, fontWeight: 700 },
  reminder: { marginTop: 12, background: "#fff3cd", color: "#6b5200", padding: 10, borderRadius: 8 },
  readerBody: { flex: 1, overflowY: "auto", border: "1px solid #eee", borderRadius: 10, padding: 20 },
  content: { whiteSpace: "pre-line", lineHeight: 1.8, color: "#222" },
  finishBtn: { marginTop: 15, background: "#333", color: "white", border: "none", padding: 12, borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  closeBtn: { background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#666" },

  discussionInputArea: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" },
  mainTextArea: { padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 60, width: "100%", background: "#fff", color: "#000", fontSize: "14px", fontFamily: "inherit" },
  btnMain: { alignSelf: "flex-end", background: "#2563eb", color: "white", border: "none", padding: "8px 20px", borderRadius: 6, cursor: "pointer" },
  
  commentBox: { background: "#f8fafc", padding: 15, borderRadius: 8, marginBottom: 15, border: "1px solid #e2e8f0" },
  commentHeader: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#666" },
  user: { fontWeight: "bold", color: "#333" },
  text: { margin: "0 0 10px 0", fontSize: 15, color: "#333" },
  replyBtn: { background: "none", border: "none", color: "#2563eb", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 600 },
  
  nestedBox: { marginLeft: 20, marginTop: 10, borderLeft: "2px solid #ddd", paddingLeft: 10 },
  replyInputBox: { display: "flex", gap: 10, marginTop: 10 },
  inputSmall: { flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ddd", background: "#fff", color: "#000" },
  btnSmall: { background: "#3b82f6", color: "white", border: "none", padding: "0 15px", borderRadius: 4, cursor: "pointer" },

  paymentCard: { width: 340, background: "white", borderRadius: 12, padding: 24, textAlign: "center", position: "relative" },
  payAmount: { fontSize: 28, fontWeight: 800, color: "#2e7d32", margin: "16px 0" },
  cancelBtn: { background: "#e0e0e0", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer" },
  payBtn: { background: "#4caf50", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  popupCard: { width: 340, background: "white", borderRadius: 12, padding: 26, textAlign: "center" },
  
  closeIconBtn: { position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999" },
  okBtn: { marginTop: 15, padding: "8px 24px", background: "#282727", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }
};
