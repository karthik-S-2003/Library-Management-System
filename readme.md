
# 📚 LIBRARY MANAGEMENT SYSTEM

Library Management System is a full-stack web application designed for interactive learning and digital library management. It features a role-based system (User, Creator, Admin) allowing users to read books, track progress, purchase premium content, and engage in discussions.


## 🚀 Tech Stack
### Frontend
- **Framework:** React (Vite)
- **Routing:** React Router v6 (Protected Routes, Role-based Access)
- **Styling:** CSS Modules / Inline Styles for responsive UI
- **State Management:** React Hooks (`useState`, `useEffect`, `useContext`)
- **Authentication:** JWT (stored in LocalStorage)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (SQLAlchemy ORM)
- **Authentication:** OAuth2 with Password Flow (JWT)
- **Validation:** Pydantic Models


## ✨ Key Features

### 1. 🔐 Authentication & Security
- **Secure Login/Register:** JWT-based session management.
- **Role-Based Access Control (RBAC):**
  - **Admin:** Manages users and approves/rejects book submissions.
  - **Creator:** Writes, edits, and publishes books (Free/Premium).
  - **User:** Reads books, tracks reading time, and buys premium content.
- **Protected Routes:** Pages are inaccessible without valid login tokens.

### 2. 📖 User Library & Reading Experience
- **Digital Library:** Browse free and premium books with search filters (Title, Author, Theme).
- **Interactive Reader:** Distraction-free reading mode with a built-in timer.
- **Progress Tracking:** 
  - Tracks reading duration automatically.
  - **Daily Reading Goal:** Visual progress bar resets every 24 hours.
- **Payment System:** Mock payment gateway to purchase "Premium" books.

### 3. ✍️ Creator Studio
- **Content Management:** Create, Edit, and Update books.
- **Status Workflow:** New books are set to "Pending" until approved by an Admin.
- **Analytics:** View stats on total books, approvals, and rejections.

### 4. 🛡️ Admin Dashboard
- **Platform Overview:** Global stats (Total Users, Books, Pending Requests).
- **Content Moderation:** Approve or Reject books submitted by creators.
- **User Registry:** View list of all registered users and their roles.

### 5. 💬 Community Features
- **Discussion Forum:** Users can comment on books and reply to others.
- **Nested Replies:** Supports threaded conversations.

## ER Diagram
![ER Diagram](<frontend/library management system/src/assets/diagram-export-1-16-2026-9_28_31-AM.png>)




## 📂 Project Structure

### Frontend (`/client`)
```bash
/src
 ├── /components
 │    ├── Navbar.jsx      
 │    ├── RequireAuth.jsx 
 │    └── RequireRole.jsx 
 ├── /pages
 │    ├── Login.jsx        
 │    ├── Dashboard.jsx   
 │    ├── User.jsx       
 │    ├── Creator.jsx    
 │    ├── Admin.jsx 
 |    ├── NotFound.jsx 
 |    ├── Register.jsx
 |    └── Readbook.jsx        
 ├── api.js                
 ├── auth.js  
 ├── main.jsx
 ├── index.css
 ├── App.css
 ├── style.css
 └── App.jsx               

```

### Backend (`/server`)
```
/routers
    ├── auth.py         
    ├── user.py        
    ├── creator.py      
    ├── admin.py       
    └── comments.py    
├── main.py         
├── models.py       
├── tables.py        
├── crud.py     
├── dependencies.py     
└── database.py      

```


⚙️ Setup Instructions
### Backend Setup
```bash
cd server

pip install fastapi uvicorn sqlalchemy python-multipart

uvicorn main:app --reload --port 8081

```
*The API will start at `http://127.0.0.1:8081`*
*API Documentation available at: `http://127.0.0.1:8081/docs`*

### Frontend Setup
```bash

cd client

npm install

npm run dev
```
*The app will be available at `http://localhost:5173`*


## 📝 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & get Token |
| `GET` | `/user/dashboard` | Fetch user stats & reading history |
| `POST` | `/user/books/{id}/pay` | Buy a premium book |
| `POST` | `/user/books/` | (Creator) Submit a new book |
| `POST` | `/admin/books/{id}/approve` | (Admin) Approve a pending book |
| `GET` | `/comments/{book_id}` | Get discussions for a book |



## 💡 Future Improvements
- [ ] Add real payment gateway integration (Stripe/Razorpay).
- [ ] Implement dark mode toggle.
- [ ] Add PDF export for reading summaries.


