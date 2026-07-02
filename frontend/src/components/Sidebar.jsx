import React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
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
  changeShareRole,
} from "../services/api";

import { useNavigate, useLocation } from "react-router-dom";
import ShareCollectionModal from "./ShareCollectionModal";
import SettingsModal from "./SettingsModal";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";
import ModalPortal from "./ModalPortal";
import ConfirmModal from "./ConfirmModal";

const Sidebar = ({ activeNote, onSelectNote, onAddCollection, favoriteRefreshKey, sharedRefreshKey, collectionRefreshKey, onShowTrash, showTrash, trashRefreshKey, onToggleSidebar, onNoteChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const activeNoteId = activeNote?._id;
  const activeCollectionId = location.pathname.startsWith('/collection/') ? location.pathname.split('/')[2] : null;
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  const [showSidebarCustomize, setShowSidebarCustomize] = useState(false);
  const [sidebarSections, setSidebarSections] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sidebarSectionOrder'));
      if (saved) return saved;
    } catch {/* ignore */}
    return [
      { id: 'recientes', label: 'Recientes', visible: true },
      { id: 'publicas', label: 'Públicas', visible: true },
      { id: 'privadas', label: 'Privadas', visible: true },
      { id: 'favoritos', label: 'Favoritos', visible: true },
      { id: 'compartidas', label: 'Compartidas', visible: true },
    ];
  });
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
  const [expandedShared, setExpandedShared] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('sidebarExpandedShared')); if (saved) return saved; } catch { /* ignore */ }
    return {};
  });
  const [sharedNotes, setSharedNotes] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);  const publicCollections = useMemo(() => collections.filter(c => c.sharedWith?.length > 0), [collections]);
  const privateCollections = useMemo(() => collections.filter(c => !c.sharedWith || c.sharedWith.length === 0), [collections]);

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
  }, [loadCollections, trashRefreshKey, collectionRefreshKey]);

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
  }, [favoriteRefreshKey, sharedRefreshKey]);

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
  }, [sharedRefreshKey]);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(expanded));
    localStorage.setItem('sidebarExpandedShared', JSON.stringify(expandedShared));
  }, [expanded, expandedShared]);

  useEffect(() => {
    localStorage.setItem('sidebarSections', JSON.stringify({
      collectionsOpen,
      publicasOpen,
      privadasOpen,
      favoritesOpen,
      sharedOpen,
    }));
  }, [collectionsOpen, publicasOpen, privadasOpen, favoritesOpen, sharedOpen]);

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

  const toggleExpandShared = async (colId) => {
    const next = { ...expandedShared, [colId]: !expandedShared[colId] };
    setExpandedShared(next);
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

  const handleCreateCollection = async () => {
    try {
      const col = await createCollection('');
      await refreshCollections();
      navigate(`/collection/${col._id}`);
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
      onNoteChange?.();
    } catch (err) {
      alert("Error al crear nota: " + err.message);
    }
  };

  const handleDeleteNote = async (e, noteId, colId, noteName) => {
    e.stopPropagation();
    const name = noteName || 'Sin título';
    setConfirmModal({
      title: "¿Quieres mover la nota a la papelera?",
      message: `Se moverá "${name}" a la papelera.`,
      confirmLabel: "Mover a la papelera",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        setCollections((prev) =>
          prev.map((c) =>
            c._id === colId
              ? { ...c, notes: c.notes?.filter((n) => n._id !== noteId) }
              : c
          )
        );
        setFavorites((prev) => prev.filter((n) => n._id !== noteId));
        try {
           await deleteNote(noteId);
          refreshFavorites();
        } catch {
          refreshCollections();
          refreshFavorites();
        }
      },
    });
  };

  const handleToggleFavorite = async (e, noteId) => {
    e.stopPropagation();
    setCollections((prev) =>
      prev.map((c) => ({
        ...c,
        notes: c.notes?.map((n) =>
          n._id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
        ),
      }))
    );
    setFavorites((prev) => {
      const exists = prev.find((n) => n._id === noteId);
      if (exists) return prev.filter((n) => n._id !== noteId);
      return prev;
    });
    try {
      await toggleFavorite(noteId);
      refreshFavorites();
    } catch {
      refreshCollections();
      refreshFavorites();
    }
  };

  const handleToggleCollectionFavorite = async (e, colId) => {
    if (e) e.stopPropagation();
    setCollections((prev) =>
      prev.map((c) => (c._id === colId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
    try {
      await toggleCollectionFavorite(colId);
      refreshFavorites();
    } catch {
      refreshCollections();
      refreshFavorites();
    }
  };

  const handleShareCollection = async (colId, email, role = 'editor') => {
    await shareCollection(colId, email, role);
    setShareModalCol(null);
  };

  const handleRemoveShare = async (colId, userId) => {
    try {
      const updatedCol = await removeShare(colId, userId);
      await refreshCollections();
      await loadSharedCollections();
      setShareModalCol((prev) => {
        if (prev && prev._id === colId) {
          return { ...prev, sharedWith: updatedCol.sharedWith || [] };
        }
        return prev;
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleChangeShareRole = async (colId, userId, role) => {
    try {
      const updatedCol = await changeShareRole(colId, userId, role);
      await refreshCollections();
      setShareModalCol((prev) => {
        if (prev && prev._id === colId) {
          return { ...prev, sharedWith: updatedCol.sharedWith || [] };
        }
        return prev;
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteCollection = async (e, colId, colName) => {
    if (e) e.stopPropagation();
    const name = colName || 'Sin nombre';
    setConfirmModal({
      title: "¿Quieres mover la colección a la papelera?",
      message: `Se moverán todas las páginas de "${name}" a la papelera.`,
      confirmLabel: "Mover a la papelera",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        setCollections((prev) => prev.filter((c) => c._id !== colId));
        try {
           await deleteCollection(colId);
          refreshCollections();
        } catch {
          refreshCollections();
        }
      },
    });
  };

  const renderCollection = (col, showCreate, expandMap = expanded, onToggle = toggleExpand) => (
    <div key={col._id} className="sidebar-collection">
      <div
        className={`sidebar-collection-header ${activeCollectionId === col._id ? "active" : ""}`}
      >
        <span className="sidebar-collection-icon-wrapper">
          <span
            className="sidebar-collection-icon"
            onClick={() => navigate(`/collection/${col._id}`)}
            style={{ cursor: "pointer" }}
          >
            {col.emoji ? (
              <span style={{ fontSize: 16, lineHeight: 1 }}>{col.emoji}</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="15" height="15">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            )}
          </span>
          <span
            className={`sidebar-collection-chevron ${expandMap[col._id] ? "open" : ""}`}
            onClick={() => onToggle(col._id)}
            style={{ cursor: "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </span>
        <span
          className="sidebar-collection-name"
          onClick={() => navigate(`/collection/${col._id}`)}
          title={`Abrir colección "${col.name}"`}
          style={{ cursor: "pointer", flex: 1 }}
        >
          {col.name}
        </span>
        <button
          className="sidebar-collection-add-btn"
          onClick={(e) => { e.stopPropagation(); handleCreateNote(col._id); }}
          title="Nueva nota"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button
          className={`sidebar-collection-star ${col.isFavorite ? "favorited" : ""}`}
          onClick={(e) => handleToggleCollectionFavorite(e, col._id)}
          title={col.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={col.isFavorite ? "#f59e0b" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke={col.isFavorite ? "#f59e0b" : "currentColor"} width="15" height="15">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>
        <button
          className="sidebar-collection-delete"
          onClick={(e) => handleDeleteCollection(e, col._id, col.name)}
          title="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21q.512.078 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48 48 0 0 0-3.478-.397m-12 .562q.51-.089 1.022-.165m0 0a48 48 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a52 52 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a49 49 0 0 0-7.5 0" />
          </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="15" height="15">
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                   </svg>
                </button>
                <button
                  className="sidebar-note-delete"
                  onClick={(e) => handleDeleteNote(e, note._id, col._id, note.title)}
                  title="Eliminar nota"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21q.512.078 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48 48 0 0 0-3.478-.397m-12 .562q.51-.089 1.022-.165m0 0a48 48 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a52 52 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a49 49 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', height: 44 }}>
        <div
          className="sidebar-workspace-btn"
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1, padding: '4px 15px', borderRadius: 50, fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Notes'}</span>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleSidebar}
          title="Ocultar sidebar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
          </svg>
        </button>
      </div>

      {showUserMenu && (
        <ModalPortal>
          <SettingsModal isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} />
        </ModalPortal>
      )}

      <div className="sidebar-nav-icons">
        <button className={`sidebar-nav-icon-btn ${location.pathname === '/library' ? 'active' : ''}`} title="Inicio" onClick={() => navigate('/library')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill={location.pathname === '/library' ? '#383836' : '#999'} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707z" clipRule="evenodd" />
          </svg>
        </button>
        <button className={`sidebar-nav-icon-btn ${showNotifications ? 'active' : ''}`} title="Notificaciones" onClick={() => setShowNotifications(!showNotifications)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill={showNotifications ? '#383836' : '#999'} viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
            <path d='M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374z' />
          </svg>
          {notifUnreadCount > 0 && <span className="sidebar-bell-dot"></span>}
        </button>
        <button className={`sidebar-nav-icon-btn ${showSidebarCustomize ? 'active' : ''}`} title="Personalizar secciones" onClick={() => setShowSidebarCustomize(!showSidebarCustomize)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={showSidebarCustomize ? '#383836' : '#999'} strokeWidth="1.5" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
        <button className={`sidebar-nav-icon-btn sidebar-nav-icon-search ${showSearch ? 'active' : ''}`} title="Buscar" onClick={() => setShowSearch(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={showSearch ? '#383836' : '#999'} strokeWidth="1.5" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607" />
          </svg>
        </button>
      </div>

      {showSidebarCustomize && (
        <div className="sidebar-customize-panel">
          <div className="sidebar-customize-header">
            <span className="sidebar-customize-title">Secciones del sidebar</span>
            <button className="sidebar-customize-done" onClick={() => setShowSidebarCustomize(false)}>Listo</button>
          </div>
          {sidebarSections.map((section, idx) => (
            <div
              key={section.id}
              className="sidebar-customize-item"
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', idx); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => {
                e.preventDefault();
                const from = parseInt(e.dataTransfer.getData('text/plain'));
                if (from === idx) return;
                const updated = [...sidebarSections];
                const [moved] = updated.splice(from, 1);
                updated.splice(idx, 0, moved);
                setSidebarSections(updated);
                localStorage.setItem('sidebarSectionOrder', JSON.stringify(updated));
              }}
            >
              <svg className="sidebar-customize-drag" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <button
                className="sidebar-customize-visibility"
                onClick={() => {
                  const updated = sidebarSections.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s);
                  setSidebarSections(updated);
                  localStorage.setItem('sidebarSectionOrder', JSON.stringify(updated));
                }}
              >
                {section.visible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
              <span className="sidebar-customize-label">{section.label}</span>
            </div>
          ))}
        </div>
      )}

      {sidebarSections.filter(s => s.visible !== false).map(section => {
        switch (section.id) {
          case 'recientes':
            return (
              <React.Fragment key="recientes">
                <div className="sidebar-nav-header" onClick={() => { if (collectionsOpen) setExpanded({}); setCollectionsOpen((o) => !o); }}>
                  <span className="sidebar-nav-title">Recientes</span>
                  <span className={`sidebar-nav-chevron ${collectionsOpen ? "open" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                  <button
                    className="sidebar-nav-add-btn"
                    onClick={(e) => { e.stopPropagation(); handleCreateCollection(); }}
                    title="Nueva colección"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
                {collectionsOpen && (
                  <nav className="sidebar-nav">
                    {loading ? (
                      <div className="sidebar-loading">Cargando...</div>
                    ) : collections.length === 0 && sharedNotes.length === 0 ? (
                      <div className="sidebar-empty">Crea tu primera colección</div>
                    ) : (
                      <>
                        {collections.map(col => renderCollection(col, true))}
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
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                  </svg>
                                </span>
                              )}
                               <span className="sidebar-note-title">{displayTitle}</span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </nav>
                )}
              </React.Fragment>
            );
          case 'publicas':
            if (publicCollections.length === 0) return null;
            return (
              <React.Fragment key="publicas">
                <div className="sidebar-nav-header" onClick={() => { if (publicasOpen) setExpandedPublicas({}); setPublicasOpen((o) => !o); }}>
                  <span className="sidebar-nav-title">Públicas</span>
                  <span className={`sidebar-nav-chevron ${publicasOpen ? "open" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
                {publicasOpen && (
                  <nav className="sidebar-nav">
                    {publicCollections.map(col => renderCollection(col, true, expandedPublicas, toggleExpandPublicas))}
                  </nav>
                )}
              </React.Fragment>
            );
          case 'privadas':
            if (privateCollections.length === 0) return null;
            return (
              <React.Fragment key="privadas">
                <div className="sidebar-nav-header" onClick={() => { if (privadasOpen) setExpandedPrivadas({}); setPrivadasOpen((o) => !o); }}>
                  <span className="sidebar-nav-title">Privadas</span>
                  <span className={`sidebar-nav-chevron ${privadasOpen ? "open" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                  <button
                    className="sidebar-nav-add-btn"
                    onClick={(e) => { e.stopPropagation(); handleCreateCollection(); }}
                    title="Nueva colección"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
                {privadasOpen && (
                  <nav className="sidebar-nav">
                    {privateCollections.map(col => renderCollection(col, true, expandedPrivadas, toggleExpandPrivadas))}
                  </nav>
                )}
              </React.Fragment>
            );
          case 'favoritos':
            if (favorites.length === 0 && favoriteCollections.length === 0) return null;
            return (
              <React.Fragment key="favoritos">
                <div className="sidebar-nav-header" onClick={() => setFavoritesOpen((o) => !o)}>
                  <span className="sidebar-nav-title">Favoritos</span>
                  <span className={`sidebar-nav-chevron ${favoritesOpen ? "open" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
                {favoritesOpen && (
                  <nav className="sidebar-nav">
                    {favoriteCollections.map((col) => (
                      <div key={col._id} className="sidebar-collection">
                        <div
                          className="sidebar-collection-header"
                          onClick={() => setExpandedFavCols((prev) => ({ ...prev, [col._id]: !prev[col._id] }))}
                        >
                          <span className="sidebar-collection-icon-wrapper">
                            <span className={`sidebar-collection-chevron ${expandedFavCols[col._id] ? "open" : ""}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                              </svg>
                            </span>
                            <span className="sidebar-collection-icon">
                              {col.emoji ? (
                                <span style={{ fontSize: 16, lineHeight: 1 }}>{col.emoji}</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                                </svg>
                              )}
                            </span>
                          </span>
                          <span className="sidebar-collection-name">{col.name}</span>
                          <button
                            className="sidebar-collection-star favorited"
                            onClick={(e) => handleToggleCollectionFavorite(e, col._id)}
                            title="Quitar de favoritos"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                          </button>
                          <button
                            className="sidebar-collection-delete"
                            onClick={(e) => handleDeleteCollection(e, col._id, col.name)}
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
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "#f59e0b" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke={note.metadata?.isFavorite ? "#f59e0b" : "currentColor"} width="15" height="15">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="sidebar-note-delete"
                                    onClick={(e) => handleDeleteNote(e, note._id, col._id, note.title)}
                                    title="Eliminar nota"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21q.512.078 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48 48 0 0 0-3.478-.397m-12 .562q.51-.089 1.022-.165m0 0a48 48 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a52 52 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a49 49 0 0 0-7.5 0" />
                                    </svg>
                                   </button>
                                </div>
                              );
                            })}
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
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill={note.metadata?.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                          </button>
                          <button
                            className="sidebar-note-delete"
                            onClick={(e) => handleDeleteNote(e, note._id, note.collectionId, note.title)}
                            title="Eliminar nota"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21q.512.078 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48 48 0 0 0-3.478-.397m-12 .562q.51-.089 1.022-.165m0 0a48 48 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a52 52 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a49 49 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </nav>
                )}
              </React.Fragment>
            );
          case 'compartidas':
            if (sharedCollections.length === 0) return null;
            return (
              <React.Fragment key="compartidas">
                <div className="sidebar-nav-header" onClick={() => { if (sharedOpen) setExpanded({}); setSharedOpen((o) => !o); }}>
                  <span className="sidebar-nav-title">Compartidas</span>
                  <span className={`sidebar-nav-chevron ${sharedOpen ? "open" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
                {sharedOpen && (
                  <nav className="sidebar-nav">
                    {sharedCollections.map((col) => (
                      <div key={col._id} className="sidebar-collection">
                        <div
                          className="sidebar-collection-header"
                          onClick={() => toggleExpandShared(col._id)}
                        >
                          <span className="sidebar-collection-icon-wrapper">
                            <span className={`sidebar-collection-chevron ${expandedShared[col._id] ? "open" : ""}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="12" height="12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                              </svg>
                            </span>
                            <span className="sidebar-collection-icon">
                              {col.emoji ? (
                                <span style={{ fontSize: 16, lineHeight: 1 }}>{col.emoji}</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                </svg>
                              )}
                            </span>
                          </span>
                          <span
                            className="sidebar-collection-name"
                            onClick={() => navigate(`/collection/${col._id}`)}
                            title={`Abrir colección "${col.name}"`}
                            style={{ cursor: "pointer", flex: 1 }}
                          >
                            {col.name}
                          </span>
                        </div>
                        {expandedShared[col._id] && (
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
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="15" height="15">
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
              </React.Fragment>
            );
          default:
            return null;
        }
      })}

      <div className="sidebar-trash-section">
        <button
          className={`sidebar-trash-btn ${showTrash ? 'active' : ''}`}
          onClick={onShowTrash}
          title="Papelera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          <span>Papelera</span>
        </button>
        <button
          className="sidebar-trash-btn"
          onClick={() => dispatch(logout())}
          title="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
        <NotificationBell onRefresh={refreshCollections} isOpen={showNotifications} onToggle={setShowNotifications} onUnreadCount={setNotifUnreadCount} />
      </div>

      {shareModalCol && (
        <ModalPortal>
          <ShareCollectionModal
            collection={shareModalCol}
            onShare={handleShareCollection}
            onRemoveShare={handleRemoveShare}
            onChangeRole={handleChangeShareRole}
            onClose={async () => {
              setShareModalCol(null);
              await refreshCollections();
              await loadSharedCollections();
            }}
          />
        </ModalPortal>
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectNote={(note) => onSelectNote({ _id: note._id, title: note.title || "Sin título", emoji: note.emoji || null, collectionId: note.collectionId })}
        onSelectCollection={(col) => navigate(`/collection/${col._id}`)}
      />

    </aside>
  );
};

export default Sidebar;
