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
  const [showNoteModal, setShowNoteModal] = useState(null);
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

  const handleCreateNote = async (title) => {
    const colId = showNoteModal;
    try {
      const note = await createNote(colId, title);
      setShowNoteModal(null);
      const notes = await getNotesByCollection(colId);
      setNotesMap((prev) => ({ ...prev, [colId]: notes }));
      onSelectNote(note);
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
                <span className="sidebar-collection-icon">📁</span>
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
                    const displayTitle = isActive
                      ? activeNote.title
                      : note.title;
                    return (
                      <div
                        key={note._id}
                        className={`sidebar-note ${isActive ? "active" : ""}`}
                        onClick={() =>
                          onSelectNote({
                            _id: note._id,
                            title: note.title,
                            collectionId: col._id,
                          })
                        }
                      >
                        <span className="sidebar-note-icon">📄</span>
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
                    onClick={() => setShowNoteModal(col._id)}
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

      {showNoteModal && (
        <CreateModal
          title="Nueva nota"
          placeholder="Título de la nota"
          onSubmit={handleCreateNote}
          onClose={() => setShowNoteModal(null)}
        />
      )}
    </aside>
  );
};

export default Sidebar;
