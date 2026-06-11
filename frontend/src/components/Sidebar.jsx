import { useState, useEffect, useRef, useCallback } from "react";
import {
  getCollections,
  getNotesByCollection,
  createCollection,
  createNote,
  deleteCollection,
  renameCollection,
  deleteNote,
  updateNoteById,
} from "../services/api";
import CreateModal from "./CreateModal";

const Sidebar = ({ activeNote, onSelectNote, onAddCollection }) => {
  const activeNoteId = activeNote?._id;
  const [collections, setCollections] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const editInputRef = useRef(null);
  const [loading, setLoading] = useState(true);

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

  const refreshCollections = async () => {
    const result = await loadCollections();
    if (result) {
      setCollections(result.collections);
      setNotesMap(result.notesMap);
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

  const startRename = (e, col) => {
    e.stopPropagation();
    setEditingColId(col._id);
    setEditingColName(col.name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const submitRename = async () => {
    const id = editingColId;
    if (!id) return;
    if (
      editingColName.trim() &&
      editingColName.trim() !== collections.find((c) => c._id === id)?.name
    ) {
      try {
        await renameCollection(id, editingColName.trim());
        await refreshCollections();
      } catch (err) {
        alert("Error al renombrar: " + err.message);
      }
    }
    setEditingColId(null);
  };

  const startNoteRename = (e, note) => {
    e.stopPropagation();
    setEditingNoteId(note._id);
    const currentTitle = activeNoteId === note._id ? activeNote.title : note.title;
    setEditingNoteTitle(currentTitle);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const submitNoteRename = async () => {
    const id = editingNoteId;
    if (!id) return;
    const trimmed = editingNoteTitle.trim();
    if (trimmed) {
      try {
        await updateNoteById(id, { title: trimmed });
        if (activeNoteId === id) {
          onSelectNote((prev) => ({ ...prev, title: trimmed }));
        }
        for (const colId in notesMap) {
          if (notesMap[colId].some((n) => n._id === id)) {
            const notes = await getNotesByCollection(colId);
            setNotesMap((prev) => ({ ...prev, [colId]: notes }));
            break;
          }
        }
      } catch (err) {
        alert("Error al renombrar: " + err.message);
      }
    }
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (e, noteId, colId) => {
    e.stopPropagation();
    if (!confirm("Eliminar esta nota?")) return;
    try {
      await deleteNote(noteId);
      const notes = await getNotesByCollection(colId);
      setNotesMap((prev) => ({ ...prev, [colId]: notes }));
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Notes</span>
      </div>

      <div className="sidebar-actions">
        <button
          className="sidebar-btn"
          onClick={() => setShowCollectionModal(true)}
        >
          <span className="sidebar-btn-icon">+</span>
          Nueva colección
        </button>
      </div>

      <nav className="sidebar-nav">
        {loading ? (
          <div className="sidebar-loading">Cargando...</div>
        ) : collections.length === 0 ? (
          <div className="sidebar-empty">Crea tu primera colección</div>
        ) : (
          collections.map((col) => (
            <div key={col._id} className="sidebar-collection">
              <div
                className="sidebar-collection-header"
                onClick={() => toggleExpand(col._id)}
              >
                <span
                  className={`sidebar-chevron ${expanded[col._id] ? "open" : ""}`}
                >
                  ▶
                </span>
                <span className="sidebar-collection-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                </span>
                {editingColId === col._id ? (
                  <input
                    ref={editInputRef}
                    className="sidebar-collection-rename"
                    value={editingColName}
                    onChange={(e) => setEditingColName(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") setEditingColId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="sidebar-collection-name"
                    onDoubleClick={(e) => startRename(e, col)}
                  >
                    {col.name}
                  </span>
                )}
                <button
                  className="sidebar-collection-delete"
                  onClick={(e) => handleDeleteCollection(e, col._id)}
                  title="Eliminar colección"
                >
                  ×
                </button>
              </div>

              {expanded[col._id] && (
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="14" height="14">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                          </span>
                        ) : null}
                        {editingNoteId === note._id ? (
                          <input
                            ref={editInputRef}
                            className="sidebar-note-rename"
                            value={editingNoteTitle}
                            onChange={(e) =>
                              setEditingNoteTitle(e.target.value)
                            }
                            onBlur={submitNoteRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitNoteRename();
                              if (e.key === "Escape") setEditingNoteId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="sidebar-note-title"
                            onDoubleClick={(e) => startNoteRename(e, note)}
                          >
                            {displayTitle}
                          </span>
                        )}
                        <button
                          className="sidebar-note-delete"
                          onClick={(e) =>
                            handleDeleteNote(e, note._id, col._id)
                          }
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
          ))
        )}
      </nav>

      {showCollectionModal && (
        <CreateModal
          title="Nueva colección"
          placeholder="Nombre de la colección"
          onSubmit={handleCreateCollection}
          onClose={() => setShowCollectionModal(false)}
        />
      )}


    </aside>
  );
};

export default Sidebar;
