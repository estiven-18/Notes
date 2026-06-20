import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotionEditor from './components/NotionEditor';
import TrashView from './components/TrashView';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicNote from './pages/PublicNote';
import ProtectedRoute from './components/ProtectedRoute';
import { verifyToken } from './store/authSlice';
import { getNoteById } from './services/api';

function Home() {
  const [activeNote, setActiveNote] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeNote'));
    } catch {
      return null;
    }
  });
  const [showTrash, setShowTrash] = useState(false);
  const [favoriteRefreshKey, setFavoriteRefreshKey] = useState(0);
  const [trashRefreshKey, setTrashRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sharedRefreshKey, setSharedRefreshKey] = useState(0);

  useEffect(() => {
    if (activeNote) {
      localStorage.setItem('activeNote', JSON.stringify(activeNote));
      const emoji = activeNote.emoji && activeNote.emoji !== null ? activeNote.emoji + ' ' : '';
      const title = activeNote.title || 'Sin título';
      document.title = `${emoji}${title} | Notes`;
    } else {
      localStorage.removeItem('activeNote');
      document.title = 'Notes';
    }
  }, [activeNote]);

  useEffect(() => {
    if (activeNote?._id && !activeNote.isDeleted) {
      getNoteById(activeNote._id).then((note) => {
        if (note.isDeleted) {
          setShowTrash(true);
          return;
        }
        setActiveNote((prev) =>
          prev && prev._id === note._id
            ? {
                ...prev,
                title: note.title || 'Sin título',
                emoji: note.emoji ?? prev.emoji,
                updatedAt: note.updatedAt,
              }
            : prev,
        );
      }).catch(() => {
        setActiveNote(null);
        localStorage.removeItem('activeNote');
      });
    }
  }, []);

  const handleSelectNote = useCallback((note) => {
    if (note?.isDeleted) {
      setShowTrash(true);
    } else {
      setShowTrash(false);
      setActiveNote(note);
    }
  }, []);

  const handleTitleChange = useCallback((noteId, newTitle) => {
    setActiveNote((prev) => prev && prev._id === noteId ? { ...prev, title: newTitle } : prev);
  }, []);

  const handleEmojiChange = useCallback((noteId, newEmoji) => {
    setActiveNote((prev) => prev && prev._id === noteId ? { ...prev, emoji: newEmoji } : prev);
  }, []);

  const handleFavoriteToggle = useCallback(() => {
    setFavoriteRefreshKey((k) => k + 1);
  }, []);

  const handleShowTrash = useCallback(() => {
    setShowTrash(true);
    setActiveNote(null);
    localStorage.removeItem('activeNote');
  }, []);

  const handleHideTrash = useCallback(() => {
    setShowTrash(false);
  }, []);

  const handleTrashRefresh = useCallback(() => {
    setTrashRefreshKey((k) => k + 1);
  }, []);

  const handleNoteRestored = useCallback(() => {
    setShowTrash(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleShareChange = useCallback(() => {
    setSharedRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <Sidebar
        activeNote={activeNote}
        onSelectNote={handleSelectNote}
        favoriteRefreshKey={favoriteRefreshKey}
        sharedRefreshKey={sharedRefreshKey}
        onShowTrash={handleShowTrash}
        showTrash={showTrash}
        trashRefreshKey={trashRefreshKey}
        isOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <NotionEditor
        noteId={activeNote?._id}
        onTitleChange={handleTitleChange}
        onEmojiChange={handleEmojiChange}
        onFavoriteToggle={handleFavoriteToggle}
        onShareChange={handleShareChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      {showTrash && (
        <TrashView
          onClose={handleHideTrash}
          onRefreshSidebar={handleTrashRefresh}
          onNoteRestored={handleNoteRestored}
        />
      )}
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const verifiedRef = useRef(false);

  useEffect(() => {
    if (token && !verifiedRef.current) {
      verifiedRef.current = true;
      dispatch(verifyToken());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/public/:publicId" element={<PublicNote />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
