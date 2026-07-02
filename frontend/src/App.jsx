import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate, useLocation, useNavigate, useMatch } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotionEditor from './components/NotionEditor';
import TrashView from './components/TrashView';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicNote from './pages/PublicNote';
import Library from './pages/Library';
import CollectionView from './pages/CollectionView';
import ProtectedRoute from './components/ProtectedRoute';
import { verifyToken } from './store/authSlice';
import { getNoteById } from './services/api';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const noteMatch = useMatch('/note/:noteId');
  const collectionMatch = useMatch('/collection/:collectionId');
  const isLibrary = location.pathname === '/library';
  const isCollectionView = !!collectionMatch;
  const noteIdFromUrl = noteMatch?.params?.noteId;

  const [activeNote, setActiveNote] = useState(() => {
    if (noteIdFromUrl) return { _id: noteIdFromUrl };
    try {
      return JSON.parse(localStorage.getItem('activeNote'));
    } catch {
      return null;
    }
  });
  const displayedActiveNote = isCollectionView ? null : activeNote;
  const [showTrash, setShowTrash] = useState(false);
  const [favoriteRefreshKey, setFavoriteRefreshKey] = useState(0);
  const [trashRefreshKey, setTrashRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sharedRefreshKey, setSharedRefreshKey] = useState(0);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);
  const [activeCollection, setActiveCollection] = useState(null);

  useEffect(() => {
    if (isCollectionView) {
      localStorage.removeItem('activeNote');
    }
  }, [isCollectionView]);

  useEffect(() => {
    if (isLibrary) {
      document.title = 'Library | Notes';
      return;
    }
    if (displayedActiveNote) {
      localStorage.setItem('activeNote', JSON.stringify(displayedActiveNote));
      const emoji = displayedActiveNote.emoji && displayedActiveNote.emoji !== null ? displayedActiveNote.emoji + ' ' : '';
      const title = displayedActiveNote.title || 'Sin título';
      document.title = `${emoji}${title} | Notes`;
    } else {
      localStorage.removeItem('activeNote');
      document.title = 'Notes';
    }
  }, [displayedActiveNote, isLibrary]);

  useEffect(() => {
    if (!isLibrary && displayedActiveNote?._id && !displayedActiveNote.isDeleted) {
      getNoteById(displayedActiveNote._id).then((note) => {
        if (note.isDeleted) {
          setActiveNote(null);
          localStorage.removeItem('activeNote');
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
  }, [displayedActiveNote, isLibrary]);

  const handleSelectNote = useCallback((note) => {
    if (note?.isDeleted) {
      setShowTrash(true);
    } else {
      setShowTrash(false);
      setActiveNote(note);
      setCollectionRefreshKey((k) => k + 1);
      if (isLibrary || isCollectionView) {
        navigate(`/note/${note._id}`);
      }
    }
  }, [isLibrary, isCollectionView, navigate]);

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

  const handleCollectionUpdate = useCallback((updatedCollection) => {
    setCollectionRefreshKey((k) => k + 1);
    if (updatedCollection) {
      setActiveCollection(updatedCollection);
    }
  }, []);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <Sidebar
        activeNote={displayedActiveNote}
        onSelectNote={handleSelectNote}
        favoriteRefreshKey={favoriteRefreshKey}
        sharedRefreshKey={sharedRefreshKey}
        collectionRefreshKey={collectionRefreshKey}
        onShowTrash={handleShowTrash}
        showTrash={showTrash}
        trashRefreshKey={trashRefreshKey}
        isOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onNoteChange={() => setNoteRefreshKey(k => k + 1)}
        activeCollection={activeCollection}
      />
      {!sidebarOpen && (
        <button
          className="sidebar-expand-btn"
          onClick={toggleSidebar}
          title="Mostrar sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="1.5" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path strokeLinecap="round" d="M3 5.5h14M3 10h14M3 14.5h14" />
          </svg>
        </button>
      )}
      {showTrash ? (
        <main className="editor-area" style={{ flex: 1, minWidth: 0 }}>
          <TrashView
            onClose={handleHideTrash}
            onRefreshSidebar={handleTrashRefresh}
            onNoteRestored={handleNoteRestored}
          />
        </main>
      ) : isLibrary ? (
        <main className="editor-area" style={{ flex: 1, minWidth: 0 }}>
          <Library noteRefreshKey={noteRefreshKey} />
        </main>
      ) : isCollectionView ? (
        <main className="editor-area" style={{ flex: 1, minWidth: 0 }}>
          <CollectionView onCollectionUpdate={handleCollectionUpdate} />
        </main>
      ) : (
        <>
          <NotionEditor
            noteId={displayedActiveNote?._id}
            onTitleChange={handleTitleChange}
            onEmojiChange={handleEmojiChange}
            onFavoriteToggle={handleFavoriteToggle}
            onShareChange={handleShareChange}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
        </>
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
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={null} />
        <Route path="/library" element={null} />
        <Route path="/collection/:collectionId" element={null} />
        <Route path="/note/:noteId" element={null} />
      </Route>
    </Routes>
  );
}

export default App;
