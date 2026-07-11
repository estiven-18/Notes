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
import { getNoteById, createCollection } from './services/api';

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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768);
  const [sharedRefreshKey, setSharedRefreshKey] = useState(0);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);
  const [activeCollection, setActiveCollection] = useState(null);
  const [editorFavorite, setEditorFavorite] = useState(false);
  const editorActionsRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      }).catch(() => {});
    }
  }, [displayedActiveNote, isLibrary]);

  const handleSelectNote = useCallback((note) => {
    if (note?.isDeleted) {
      setShowTrash(true);
    } else {
      setShowTrash(false);
      setActiveNote(note);
      setCollectionRefreshKey((k) => k + 1);
      if (note?._id) {
        navigate(`/note/${note._id}`, { replace: false });
      }
    }
  }, [navigate]);

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
    if (updatedCollection) {
      setActiveCollection(updatedCollection);
      setCollectionRefreshKey((k) => k + 1);
    }
  }, []);

  const handleCreateCollection = useCallback(async () => {
    try {
      const col = await createCollection('');
      setCollectionRefreshKey((k) => k + 1);
      navigate(`/collection/${col._id}`);
      return col;
    } catch (err) {
      console.error('Error al crear colección:', err);
    }
  }, [navigate]);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <div className="mobile-topbar">
        <div className="mobile-topbar-left">
          <button className="mobile-topbar-btn" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        <div className="mobile-topbar-right">
          {displayedActiveNote && (
            <>
              <button className={`mobile-topbar-btn ${editorFavorite ? 'favorited' : ''}`} onClick={() => editorActionsRef.current?.toggleFavorite()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={editorFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </button>
              <button className="mobile-topbar-btn" onClick={() => editorActionsRef.current?.openShare()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {sidebarOpen && isMobileView && <div className="sidebar-overlay active" onClick={toggleSidebar} />}
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
        onCollectionUpdate={activeCollection}
      />
      {!sidebarOpen && isMobileView && (
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
          <Library noteRefreshKey={noteRefreshKey} onCollectionCreated={() => setCollectionRefreshKey(k => k + 1)} />
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
            onCreateCollection={handleCreateCollection}
            editorActionsRef={editorActionsRef}
            onEditorStateChange={(state) => {
              setEditorFavorite(state.isFavorite);
            }}
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
