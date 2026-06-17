import { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import { useDispatch } from "react-redux";
import {
  getCollections,
  getNotesByCollection,
  createCollection,
  createNote,
  deleteCollection,
  deleteNote,
  getFavorites,
  toggleFavorite,
  getFavoriteCollections,
  toggleCollectionFavorite,
  shareCollection,
  removeShare,
  getSharedCollections,
  getSharedNotes,
  searchNotes,
} from "../services/api";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import CreateModal from "./CreateModal";
import ShareCollectionModal from "./ShareCollectionModal";
import NotificationBell from "./NotificationBell";
import ModalPortal from "./ModalPortal";

const Sidebar = ({ activeNote, onSelectNote, onAddCollection, favoriteRefreshKey }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeNoteId = activeNote?._id;
  const [collections, setCollections] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteCollections, setFavoriteCollections] = useState([]);
  const [favoritesOpen, setFavoritesOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.favoritesOpen !== undefined) return s.favoritesOpen; } catch {/* ignore */}
    return true;
  });
  const [expanded, setExpanded] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sidebarExpanded'));
      if (saved) return saved;
    } catch { /* ignore */ }
    try {
      const active = JSON.parse(localStorage.getItem('activeNote'));
      if (active?.collectionId) return { [active.collectionId]: true };
    } catch { /* ignore */ }
    return {};
  });
  const [expandedPublicas, setExpandedPublicas] = useState({});
  const [expandedPrivadas, setExpandedPrivadas] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.collectionsOpen !== undefined) return s.collectionsOpen; } catch {/* ignore */}
    return true;
  });
  const [expandedFavCols, setExpandedFavCols] = useState({});
  const [publicasOpen, setPublicasOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.publicasOpen !== undefined) return s.publicasOpen; } catch {/* ignore */}
    return true;
  });
  const [privadasOpen, setPrivadasOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.privadasOpen !== undefined) return s.privadasOpen; } catch {/* ignore */}
    return true;
  });

  const [loading, setLoading] = useState(true);
  const [shareModalCol, setShareModalCol] = useState(null);
  const [sharedCollections, setSharedCollections] = useState([]);
  const [sharedOpen, setSharedOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.sharedOpen !== undefined) return s.sharedOpen; } catch {/* ignore */}
    return true;
  });
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedNotesOpen, setSharedNotesOpen] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sidebarSections')); if (s?.sharedNotesOpen !== undefined) return s.sharedNotesOpen; } catch {/* ignore */}
    return false;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ collections: [], notes: [] });
  const [searching, setSearching] = useState(false);

  const publicCollections = useMemo(() => collections.filter(c => c.sharedWith?.length > 0), [collections]);
  const privateCollections = useMemo(() => collections.filter(c => !c.sharedWith || c.sharedWith.length === 0), [collections]);
  const allCollections = useMemo(() => [...collections, ...sharedCollections], [collections, sharedCollections]);

  const loadCollections = useCallback(async () => {
    try {
      const cols = await getCollections();
      const notes = {};
      for (const col of cols) {
        try {
          notes[col._id] = await getNotesByCollection(col._id);
        } catch {
          notes[col._id] = [];
        }
      }
      return { collections: cols, notesMap: notes };
    } catch (err) {
      console.error('Error loading collections:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCollections().then((result) => {
      if (!cancelled && result) {
        setCollections(result.collections);
        setNotesMap(result.notesMap);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [loadCollections]);

  const refreshFavorites = useCallback(async () => {
    try {
      const [favNotes, favCols] = await Promise.all([
        getFavorites(),
        getFavoriteCollections(),
      ]);
      setFavorites(favNotes);
      setFavoriteCollections(favCols);
      setExpandedFavCols((prev) => {
        const next = { ...prev };
        favCols.forEach((col) => { if (!(col._id in next)) next[col._id] = true; });
        return next;
      });
    } catch {
      setFavorites([]);
      setFavoriteCollections([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFavorites(), getFavoriteCollections()]).then(([favNotes, favCols]) => {
      if (cancelled) return;
      setFavorites(favNotes);
      setFavoriteCollections(favCols);
      setExpandedFavCols((prev) => {
        const next = { ...prev };
        favCols.forEach((col) => { if (!(col._id in next)) next[col._id] = true; });
        return next;
      });
    }).catch(() => {
      if (!cancelled) {
        setFavorites([]);
        setFavoriteCollections([]);
      }
    });
    return () => { cancelled = true; };
  }, [favoriteRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSharedCollections();
        if (!cancelled) setSharedCollections(data);
      } catch {
        if (!cancelled) setSharedCollections([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSharedNotes();
        if (!cancelled) setSharedNotes(data);
      } catch {
        if (!cancelled) setSharedNotes([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(expanded));
  }, [expanded]);

  useEffect(() => {
    localStorage.setItem('sidebarSections', JSON.stringify({
      collectionsOpen,
      publicasOpen,
      privadasOpen,
      favoritesOpen,
      sharedOpen,
      sharedNotesOpen,
    }));
  }, [collectionsOpen, publicasOpen, privadasOpen, favoritesOpen, sharedOpen, sharedNotesOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      startTransition(() => setSearchResults({ collections: [], notes: [] }));
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchNotes(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults({ collections: [], notes: [] });
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleExpand = async (colId) => {
    const next = { ...expanded, [colId]: !expanded[colId] };
    setExpanded(next);
    if (next[colId] && (!notesMap[colId] || notesMap[colId].length === 0)) {
      try {
        const notes = await getNotesByCollection(colId);
        setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      } catch {
        setNotesMap((prev) => ({ ...prev, [colId]: [] }));
      }
    }
  };

  const toggleExpandPublicas = async (colId) => {
    const next = { ...expandedPublicas, [colId]: !expandedPublicas[colId] };
    setExpandedPublicas(next);
    if (next[colId] && (!notesMap[colId] || notesMap[colId].length === 0)) {
      try {
        const notes = await getNotesByCollection(colId);
        setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      } catch {
        setNotesMap((prev) => ({ ...prev, [colId]: [] }));
      }
    }
  };

  const toggleExpandPrivadas = async (colId) => {
    const next = { ...expandedPrivadas, [colId]: !expandedPrivadas[colId] };
    setExpandedPrivadas(next);
    if (next[colId] && (!notesMap[colId] || notesMap[colId].length === 0)) {
      try {
        const notes = await getNotesByCollection(colId);
        setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      } catch {
        setNotesMap((prev) => ({ ...prev, [colId]: [] }));
      }
    }
  };

  const loadSharedCollections = async () => {
    try {
      const data = await getSharedCollections();
      setSharedCollections(data);
    } catch {
      setSharedCollections([]);
    }
  };

  const refreshCollections = async () => {
    const result = await loadCollections();
    if (result) {
      setCollections(result.collections);
      setNotesMap(result.notesMap);
    }
    loadSharedCollections();
    try {
      const data = await getSharedNotes();
      setSharedNotes(data);
    } catch {
      setSharedNotes([]);
    }
  };

  const handleCreateCollection = async (name) => {
    try {
      await createCollection(name);
      setShowCollectionModal(false);
      await refreshCollections();
      if (onAddCollection) onAddCollection();
    } catch (err) {
      alert("Error al crear colección: " + err.message);
    }
  };

  const handleCreateNote = async (colId) => {
    try {
      const note = await createNote(colId, 'Sin título');
      const notes = await getNotesByCollection(colId);
      setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      onSelectNote({ ...note });
    } catch (err) {
      alert("Error al crear nota: " + err.message);
    }
  };

  const handleDeleteNote = async (e, noteId, colId) => {
    e.stopPropagation();
    if (!confirm("Eliminar esta nota?")) return;
    try {
      await deleteNote(noteId);
      const notes = await getNotesByCollection(colId);
      setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      refreshFavorites();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleFavorite = async (e, noteId) => {
    e.stopPropagation();
    try {
      await toggleFavorite(noteId);
      refreshFavorites();
      refreshCollections();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleCollectionFavorite = async (e, colId) => {
    e.stopPropagation();
    try {
      await toggleCollectionFavorite(colId);
      refreshFavorites();
      refreshCollections();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleShareCollection = async (colId, email) => {
    await shareCollection(colId, email);
    setShareModalCol(null);
  };

  const handleRemoveShare = async (colId, userId) => {
    try {
      await removeShare(colId, userId);
      await refreshCollections();
      await loadSharedCollections();
      setShareModalCol((prev) => {
        if (prev && prev._id === colId) {
          const updated = collections.find((c) => c._id === colId);
          return updated ? { ...prev, sharedWith: updated.sharedWith } : prev;
        }
        return prev;
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteCollection = async (e, colId) => {
    e.stopPropagation();
    if (!confirm("Eliminar esta colección y todas sus notas?")) return;
    try {
      await deleteCollection(colId);
      await refreshCollections();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const renderSharedCollection = (col, expandMap = expanded, onToggle = toggleExpand) => (
    <div key={col._id} className="sidebar-collection">
      <div
        className="sidebar-collection-header"
        onClick={() => onToggle(col._id)}
      >
        <span className={`sidebar-chevron ${expandMap[col._id] ? "open" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </span>
        <span className="sidebar-collection-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
        </span>
        <span className="sidebar-collection-name">{col.name}</span>
        <span className="shared-badge" title={`Compartido por ${col.user?.name || 'usuario'}`}>compartido</span>
      </div>
      {expandMap[col._id] && (
        <div className="sidebar-notes">
          {(col.notes || []).map((note) => {
            const isActive = activeNoteId === note._id;
            const rawTitle = isActive ? activeNote.title : note.title;
            const displayTitle = rawTitle || 'Sin título';
            const noteEmoji = isActive ? activeNote.emoji : note.emoji;
            return (
              <div
                key={note._id}
                className={`sidebar-note ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelectNote({
                    _id: note._id,
                    title: note.title || 'Sin título',
                    emoji: note.emoji != null ? note.emoji : null,
                    updatedAt: note.updatedAt,
                    collectionId: col._id,
                  });
                }}
              >
                {noteEmoji ? (
                  <span className="sidebar-note-icon">{noteEmoji}</span>
                ) : noteEmoji === null ? (
                  <span className="sidebar-note-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </span>
                ) : null}
                <span className="sidebar-note-title">{displayTitle}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCollection = (col, showCreate, expandMap = expanded, onToggle = toggleExpand) => (
    <div key={col._id} className="sidebar-collection">
      <div
        className="sidebar-collection-header"
        onClick={() => onToggle(col._id)}
      >
        <span className={`sidebar-chevron ${expandMap[col._id] ? "open" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </span>
        <span className="sidebar-collection-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
        </span>
        <span className="sidebar-collection-name">{col.name}</span>
        <button
          className={`sidebar-collection-star ${col.isFavorite ? "favorited" : ""}`}
          onClick={(e) => handleToggleCollectionFavorite(e, col._id)}
          title={col.isFavorite ? "Quitar de favoritos" : "Añadir colección a favoritos"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={col.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>
        <button
          className="sidebar-collection-share"
          onClick={(e) => { e.stopPropagation(); setShareModalCol(col); }}
          title="Compartir colección"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
        </button>
        <button
          className="sidebar-collection-delete"
          onClick={(e) => handleDeleteCollection(e, col._id)}
          title="Eliminar colección"
        >
          ×
        </button>
      </div>

      {expandMap[col._id] && (
        <div className="sidebar-notes">
          {(notesMap[col._id] || []).map((note) => {
            const isActive = activeNoteId === note._id;
            const rawTitle = isActive ? activeNote.title : note.title;
            const displayTitle = rawTitle || 'Sin título';
            const noteEmoji = isActive ? activeNote.emoji : note.emoji;
            return (
              <div
                key={note._id}
                className={`sidebar-note ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (activeNote && activeNote._id !== note._id) {
                    setNotesMap((prev) => {
                      for (const cId of Object.keys(prev)) {
                        const notes = prev[cId];
                        const idx = notes.findIndex((n) => n._id === activeNote._id);
                        if (idx !== -1) {
                          const updated = [...notes];
                          updated[idx] = { ...updated[idx], emoji: activeNote.emoji, title: activeNote.title };
                          return { ...prev, [cId]: updated };
                        }
                      }
                      return prev;
                    });
                  }
                  onSelectNote({
                    _id: note._id,
                    title: note.title || 'Sin título',
                    emoji: note.emoji != null ? note.emoji : null,
                    updatedAt: note.updatedAt,
                    collectionId: col._id,
                  });
                }}
              >
                {noteEmoji ? (
                  <span className="sidebar-note-icon">{noteEmoji}</span>
                ) : noteEmoji === null ? (
                  <span className="sidebar-note-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </span>
                ) : null}
                <span className="sidebar-note-title">{displayTitle}</span>
                <button
                  className={`sidebar-note-star ${note.metadata?.isFavorite ? "favorited" : ""}`}
                  onClick={(e) => handleToggleFavorite(e, note._id)}
                  title={note.metadata?.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </button>
                <button
                  className="sidebar-note-delete"
                  onClick={(e) => handleDeleteNote(e, note._id, col._id)}
                  title="Eliminar nota"
                >
                  ×
                </button>
              </div>
            );
          })}
          {showCreate && (
            <button
              className="sidebar-add-note-btn"
              onClick={() => handleCreateNote(col._id)}
            >
              <span className="sidebar-btn-icon-small">+</span>
              Nueva nota
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span className="sidebar-title">Notes</span>
        <div style={{ flex: 1 }} />
        <NotificationBell onRefresh={refreshCollections} />
        <button
          onClick={() => navigate('/profile')}
          style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
          title="Editar perfil"
        >
          Perfil
        </button>
        <button
          onClick={() => dispatch(logout())}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>

      <div className="sidebar-search">
        <input
          className="sidebar-search-input"
          type="text"
          placeholder="Buscar notas, colecciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {(searchQuery.trim() && (searchResults.collections.length > 0 || searchResults.notes.length > 0 || searching)) && (
          <div className="sidebar-search-results">
            {searching ? (
              <div className="sidebar-search-loading">Buscando...</div>
            ) : (
              <>
                {searchResults.collections.map(col => (
                  <div
                    key={col._id}
                    className="sidebar-search-item"
                    onClick={() => {
                      const inPublic = publicCollections.some(c => c._id === col._id);
                      const inPrivate = privateCollections.some(c => c._id === col._id);
                      const inShared = sharedCollections.some(c => c._id === col._id);
                      if (inShared) setSharedOpen(true);
                      if (inPublic) setPublicasOpen(true);
                      if (inPrivate) setPrivadasOpen(true);
                      if (inPublic) setExpandedPublicas((prev) => ({ ...prev, [col._id]: true }));
                      if (inPrivate) setExpandedPrivadas((prev) => ({ ...prev, [col._id]: true }));
                      if (inShared) setExpanded((prev) => ({ ...prev, [col._id]: true }));
                      setSearchQuery("");
                      setSearchResults({ collections: [], notes: [] });
                    }}
                  >
                    <span className="sidebar-search-item-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                      </svg>
                    </span>
                    <span className="sidebar-search-item-name">{col.name}</span>
                    <span className="sidebar-search-item-type">Colección</span>
                  </div>
                ))}
                {searchResults.notes.map(note => (
                  <div
                    key={note._id}
                    className="sidebar-search-item"
                    onClick={() => {
                      const inPublic = publicCollections.some(c => c._id === note.collectionId);
                      const inPrivate = privateCollections.some(c => c._id === note.collectionId);
                      const inShared = sharedCollections.some(c => c._id === note.collectionId);
                      if (inShared) setSharedOpen(true);
                      if (inPublic) setPublicasOpen(true);
                      if (inPrivate) setPrivadasOpen(true);
                      if (inPublic) setExpandedPublicas((prev) => ({ ...prev, [note.collectionId]: true }));
                      if (inPrivate) setExpandedPrivadas((prev) => ({ ...prev, [note.collectionId]: true }));
                      if (inShared) setExpanded((prev) => ({ ...prev, [note.collectionId]: true }));
                      onSelectNote({
                        _id: note._id,
                        title: note.title || 'Sin título',
                        emoji: note.emoji != null ? note.emoji : null,
                        collectionId: note.collectionId,
                      });
                      setSearchQuery("");
                      setSearchResults({ collections: [], notes: [] });
                    }}
                  >
                    <span className="sidebar-search-item-icon">{note.emoji || '📄'}</span>
                    <span className="sidebar-search-item-name">{note.title || 'Sin título'}</span>
                    <span className="sidebar-search-item-type">{note.collectionName}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-nav-header" onClick={() => { if (collectionsOpen) setExpanded({}); setCollectionsOpen((o) => !o); }}>
        <span className={`sidebar-nav-chevron ${collectionsOpen ? "open" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </span>
        <span className="sidebar-nav-title">Recientes</span>
        <button
          className="sidebar-nav-add-btn"
          onClick={(e) => { e.stopPropagation(); setShowCollectionModal(true); }}
          title="Nueva colección"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {collectionsOpen && (
        <nav className="sidebar-nav">
          {loading ? (
          <div className="sidebar-loading">Cargando...</div>
        ) : allCollections.length === 0 ? (
          <div className="sidebar-empty">Crea tu primera colección</div>
        ) : (
          <>
            {collections.map(col => renderCollection(col, true))}
            {sharedCollections.map(col => renderSharedCollection(col, expanded, toggleExpand))}
          </>
        )}
        </nav>
      )}

      {publicCollections.length > 0 && (
        <>
          <div className="sidebar-nav-header" onClick={() => { if (publicasOpen) setExpandedPublicas({}); setPublicasOpen((o) => !o); }}>
            <span className={`sidebar-nav-chevron ${publicasOpen ? "open" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <span className="sidebar-nav-title">Públicas</span>
          </div>
          {publicasOpen && (
            <nav className="sidebar-nav">
              {publicCollections.map(col => renderCollection(col, true, expandedPublicas, toggleExpandPublicas))}
            </nav>
          )}
        </>
      )}

      {privateCollections.length > 0 && (
        <>
          <div className="sidebar-nav-header" onClick={() => { if (privadasOpen) setExpandedPrivadas({}); setPrivadasOpen((o) => !o); }}>
            <span className={`sidebar-nav-chevron ${privadasOpen ? "open" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <span className="sidebar-nav-title">Privadas</span>
            <button
              className="sidebar-nav-add-btn"
              onClick={(e) => { e.stopPropagation(); setShowCollectionModal(true); }}
              title="Nueva colección"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          {privadasOpen && (
            <nav className="sidebar-nav">
              {privateCollections.map(col => renderCollection(col, true, expandedPrivadas, toggleExpandPrivadas))}
            </nav>
          )}
        </>
      )}

      {(favorites.length > 0 || favoriteCollections.length > 0) && (
        <>
          <div className="sidebar-nav-header" onClick={() => setFavoritesOpen((o) => !o)}>
            <span className={`sidebar-nav-chevron ${favoritesOpen ? "open" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <span className="sidebar-nav-title">Favoritos</span>
          </div>
          {favoritesOpen && (
            <nav className="sidebar-nav">
              {favoriteCollections.map((col) => (
                <div key={col._id} className="sidebar-collection">
                  <div
                    className="sidebar-collection-header"
                    onClick={() => setExpandedFavCols((prev) => ({ ...prev, [col._id]: !prev[col._id] }))}
                  >
                    <span className={`sidebar-chevron ${expandedFavCols[col._id] ? "open" : ""}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                    <span className="sidebar-collection-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                      </svg>
                    </span>
                    <span className="sidebar-collection-name">{col.name}</span>
                    <button
                      className="sidebar-collection-star favorited"
                      onClick={(e) => handleToggleCollectionFavorite(e, col._id)}
                      title="Quitar de favoritos"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    </button>
                    <button
                      className="sidebar-collection-delete"
                      onClick={(e) => handleDeleteCollection(e, col._id)}
                      title="Eliminar colección"
                    >
                      ×
                    </button>
                  </div>
                  {expandedFavCols[col._id] && (
                    <div className="sidebar-notes">
                      {col.notes.map((note) => {
                        const isActive = activeNoteId === note._id;
                        const displayTitle = (isActive ? activeNote.title : note.title) || 'Sin título';
                        const noteEmoji = isActive ? activeNote.emoji : note.emoji;
                        return (
                          <div
                            key={note._id}
                            className={`sidebar-note ${isActive ? "active" : ""}`}
                            onClick={() => {
                              onSelectNote({
                                _id: note._id,
                                title: note.title || 'Sin título',
                                emoji: note.emoji != null ? note.emoji : null,
                                collectionId: col._id,
                                updatedAt: note.updatedAt,
                              });
                            }}
                          >
                            {noteEmoji ? (
                              <span className="sidebar-note-icon">{noteEmoji}</span>
                            ) : noteEmoji === null ? (
                              <span className="sidebar-note-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                              </span>
                            ) : null}
                            <span className="sidebar-note-title">{displayTitle}</span>
                            <button
                              className={`sidebar-note-star ${note.metadata?.isFavorite ? "favorited" : ""}`}
                              onClick={(e) => handleToggleFavorite(e, note._id)}
                              title={note.metadata?.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                              </svg>
                            </button>
                            <button
                              className="sidebar-note-delete"
                              onClick={(e) => handleDeleteNote(e, note._id, col._id)}
                              title="Eliminar nota"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button
                        className="sidebar-add-note-btn"
                        onClick={() => handleCreateNote(col._id)}
                      >
                        <span className="sidebar-btn-icon-small">+</span>
                        Nueva nota
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {favorites.map((note) => {
                const isActive = activeNoteId === note._id;
                const displayTitle = (isActive ? activeNote.title : note.title) || 'Sin título';
                const noteEmoji = isActive ? activeNote.emoji : note.emoji;
                return (
                  <div
                    key={note._id}
                    className={`sidebar-note ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onSelectNote({
                        _id: note._id,
                        title: note.title || 'Sin título',
                        emoji: note.emoji != null ? note.emoji : null,
                        collectionId: note.collectionId,
                        updatedAt: note.updatedAt,
                      });
                    }}
                  >
                    {noteEmoji ? (
                      <span className="sidebar-note-icon">{noteEmoji}</span>
                    ) : noteEmoji === null ? (
                      <span className="sidebar-note-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </span>
                    ) : null}
                    <span className="sidebar-note-title">{displayTitle}</span>
                    <button
                      className={`sidebar-note-star ${note.metadata?.isFavorite ? "favorited" : ""}`}
                      onClick={(e) => handleToggleFavorite(e, note._id)}
                      title={note.metadata?.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    </button>
                    <button
                      className="sidebar-note-delete"
                      onClick={(e) => handleDeleteNote(e, note._id, note.collectionId)}
                      title="Eliminar nota"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </nav>
          )}
        </>
      )}

      {sharedCollections.length > 0 && (
        <>
          <div className="sidebar-nav-header" onClick={() => { if (sharedOpen) setExpanded({}); setSharedOpen((o) => !o); }}>
            <span className={`sidebar-nav-chevron ${sharedOpen ? "open" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <span className="sidebar-nav-title">Compartidas</span>
          </div>
          {sharedOpen && (
            <nav className="sidebar-nav">
              {sharedCollections.map((col) => (
                <div key={col._id} className="sidebar-collection">
                  <div
                    className="sidebar-collection-header"
                    onClick={() => toggleExpand(col._id)}
                  >
                    <span className={`sidebar-chevron ${expanded[col._id] ? "open" : ""}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                    <span className="sidebar-collection-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                    </span>
                    <span className="sidebar-collection-name">{col.name}</span>
                    <span className="shared-badge" title={`Compartido por ${col.user?.name || 'usuario'}`}>compartido</span>
                  </div>
      {expanded[col._id] && (
        <div className="sidebar-notes">
                      {(col.notes || []).map((note) => {
                        const isActive = activeNoteId === note._id;
                        const rawTitle = isActive ? activeNote.title : note.title;
                        const displayTitle = rawTitle || 'Sin título';
                        const noteEmoji = isActive ? activeNote.emoji : note.emoji;
                        return (
                          <div
                            key={note._id}
                            className={`sidebar-note ${isActive ? "active" : ""}`}
                            onClick={() => {
                              onSelectNote({
                                _id: note._id,
                                title: note.title || 'Sin título',
                                emoji: note.emoji != null ? note.emoji : null,
                                updatedAt: note.updatedAt,
                                collectionId: col._id,
                              });
                            }}
                          >
                            {noteEmoji ? (
                              <span className="sidebar-note-icon">{noteEmoji}</span>
                            ) : noteEmoji === null ? (
                              <span className="sidebar-note-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                              </span>
                            ) : null}
                            <span className="sidebar-note-title">{displayTitle}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}
        </>
      )}

      {sharedNotes.length > 0 && (
        <>
          <div className="sidebar-nav-header" onClick={() => setSharedNotesOpen((o) => !o)}>
            <span className={`sidebar-nav-chevron ${sharedNotesOpen ? "open" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <span className="sidebar-nav-title">Notas compartidas</span>
          </div>
          {sharedNotesOpen && (
            <nav className="sidebar-nav">
              {sharedNotes.map((note) => {
                const isActive = activeNoteId === note._id;
                const displayTitle = note.title || 'Sin título';
                return (
                  <div
                    key={note._id}
                    className={`sidebar-note ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onSelectNote({
                        _id: note._id,
                        title: note.title || 'Sin título',
                        emoji: note.emoji != null ? note.emoji : null,
                        collectionId: note.collectionId,
                      });
                    }}
                  >
                    {note.emoji ? (
                      <span className="sidebar-note-icon">{note.emoji}</span>
                    ) : (
                      <span className="sidebar-note-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </span>
                    )}
                    <span className="sidebar-note-title">{displayTitle}</span>
                    {note.collectionName && (
                      <span className="shared-badge">{note.collectionName}</span>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </>
      )}

      {showCollectionModal && (
        <ModalPortal>
          <CreateModal
            title="Nueva colección"
            placeholder="Nombre de la colección"
            onSubmit={handleCreateCollection}
            onClose={() => setShowCollectionModal(false)}
          />
        </ModalPortal>
      )}

      {shareModalCol && (
        <ModalPortal>
          <ShareCollectionModal
            collection={shareModalCol}
            onShare={handleShareCollection}
            onRemoveShare={handleRemoveShare}
            onClose={async () => {
              setShareModalCol(null);
              await refreshCollections();
              await loadSharedCollections();
            }}
          />
        </ModalPortal>
      )}

    </aside>
  );
};

export default Sidebar;
