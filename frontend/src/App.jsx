import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotionEditor from './components/NotionEditor';
import Login from './pages/Login';
import Register from './pages/Register';
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
  const [favoriteRefreshKey, setFavoriteRefreshKey] = useState(0);

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
    if (activeNote?._id) {
      getNoteById(activeNote._id).then((note) => {
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
      }).catch(() => {});
    }
  }, []);

  const handleSelectNote = useCallback((note) => {
    setActiveNote(note);
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

  return (
    <div className="app-layout">
      <Sidebar
        activeNote={activeNote}
        onSelectNote={handleSelectNote}
        favoriteRefreshKey={favoriteRefreshKey}
      />
      <NotionEditor
        noteId={activeNote?._id}
        onTitleChange={handleTitleChange}
        onEmojiChange={handleEmojiChange}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
