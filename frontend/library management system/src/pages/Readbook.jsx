import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiGet, apiPost } from "../api";
import { getAuth } from "../auth";

export default function ReadBook() {
  const { id } = useParams();
  const auth = getAuth();
  const nav = useNavigate();
  
  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) { nav("/login"); return; }
    loadData();
  }, [id]);

  async function loadData() {
    try {
      // 1. Get Book
      const allBooks = await apiGet("/books");
      const found = allBooks.find(b => b.id === parseInt(id));
      setBook(found);

      // 2. Get Comments (Safe Check)
      try {
        const comms = await apiGet(`/comments/${id}`);
        if (Array.isArray(comms)) {
          setComments(comms);
        } else {
          console.error("Comments API returned non-array:", comms);
          setComments([]); // Fallback to empty
        }
      } catch (err) {
        console.error("Failed to load comments (Table missing?)", err);
        setError("Could not load comments. Please check database.");
      }

    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(parentId = null, text) {
    if (!text.trim()) return;
    try {
      await apiPost("/comments/", {
        book_id: parseInt(id),
        content: text,
        parent_id: parentId
      }, auth.access_token);
      
      setNewComment("");
      setReplyText("");
      setActiveReplyId(null);
      loadData(); 
    } catch (e) {
      alert("Failed to post comment. " + e.message);
    }
  }

  // Recursive Comment Node
  const CommentNode = ({ comment }) => (
    <div style={styles.commentBox}>
      <div style={styles.commentHeader}>
        <span style={styles.user}>{comment.user_name}</span>
        <span style={styles.date}>{new Date(comment.created_at).toLocaleDateString()}</span>
      </div>
      <p style={styles.text}>{comment.content}</p>
      
      <button style={styles.replyBtn} onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}>
        Reply
      </button>

      {activeReplyId === comment.id && (
        <div style={styles.replyInputBox}>
          <input 
            style={styles.inputSmall}
            placeholder={`Reply...`} 
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
          <button style={styles.btnSmall} onClick={() => handleSubmit(comment.id, replyText)}>Send</button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={styles.nestedBox}>
          {comment.replies.map(reply => (
            <CommentNode key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );

  if (!book) return <div style={{padding: 40, textAlign:"center"}}>Loading Book...</div>;

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        {/* BOOK CONTENT */}
        <div style={styles.reader}>
          <h1>{book.title}</h1>
          <p style={styles.meta}>By {book.author}</p>
          <hr style={{borderColor: "#eee", margin: "20px 0"}}/>
          <div style={styles.content}>
            {book.content.split("\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>

        {/* DISCUSSION */}
        <div style={styles.discussion}>
          <h3>Discussion {comments ? `(${comments.length})` : ""}</h3>
          
          {error && <p style={{color: "red", background:"#fee", padding:10}}>{error}</p>}

          <div style={styles.mainInput}>
            <textarea
              style={styles.textarea}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button style={styles.btnMain} onClick={() => handleSubmit(null, newComment)}>Post Comment</button>
          </div>

          <div style={styles.list}>
            {comments.map(c => <CommentNode key={c.id} comment={c} />)}
            {comments.length === 0 && !error && <p style={{color: "#999"}}>No comments yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "0 auto", padding: "40px 20px" },
  reader: { background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "40px" },
  meta: { color: "#666", fontStyle: "italic" },
  content: { fontSize: "18px", lineHeight: "1.8", color: "#333" },
  discussion: { marginTop: "40px" },
  mainInput: { marginBottom: "30px" },
  textarea: { width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px", fontSize: "15px" },
  btnMain: { marginTop: "10px", padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  list: { display: "flex", flexDirection: "column", gap: "20px" },
  commentBox: { background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  commentHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  user: { fontWeight: "bold", color: "#1e293b", fontSize: "14px" },
  date: { fontSize: "12px", color: "#94a3b8" },
  text: { margin: "0 0 10px 0", color: "#475569", fontSize: "15px" },
  replyBtn: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", padding: 0, fontWeight: "600" },
  nestedBox: { marginLeft: "20px", marginTop: "15px", borderLeft: "2px solid #e2e8f0", paddingLeft: "15px" },
  replyInputBox: { marginTop: "10px", display: "flex", gap: "10px" },
  inputSmall: { flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" },
  btnSmall: { padding: "8px 15px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }
};
