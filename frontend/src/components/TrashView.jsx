import { useState, useEffect, useMemo, useCallback } from "react";
import { getTrashItems, restoreNote, permanentDeleteNote, restoreCollection, permanentDeleteCollection, getNoteById } from "../services/api";
import ModalPortal from "./ModalPortal";

const TRASH_EXPIRY_DAYS = 30;

const TrashView = ({ onClose, onRefreshSidebar, onNoteRestored }) => {
  const [trashItems, setTrashItems] = useState({ notes: [], collections: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notePreview, setNotePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCollections, setExpandedCollections] = useState({});

  const loadTrash = useCallback(async () => {
    try {
      const data = await getTrashItems();
      setTrashItems(data);
    } catch (err) {
      console.error("Error loading trash:", err);
      alert("Error cargando papelera: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrash(); }, [loadTrash]);

  useEffect(() => {
    let cancelled = false;
    if (selectedNote?.isDeleted) {
      getNoteById(selectedNote._id).then((note) => {
        if (!cancelled) setNotePreview(note);
      }).catch(() => {
        if (!cancelled) setNotePreview(null);
      });
    }
    return () => { cancelled = true; };
  }, [selectedNote]);

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return TRASH_EXPIRY_DAYS;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diff = now - deleted;
    const days = Math.max(0, TRASH_EXPIRY_DAYS - Math.floor(diff / (1000 * 60 * 60 * 24)));
    return days;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleRestore = async (type, id) => {
    try {
      let restoredNote = null;
      if (type === "note") restoredNote = await restoreNote(id);
      else await restoreCollection(id);
      await loadTrash();
      if (onRefreshSidebar) onRefreshSidebar();
      if (type === "note" && restoredNote && onNoteRestored) {
        onNoteRestored(restoredNote);
      }
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handlePermanentDelete = async (type, id) => {
    if (!confirm("\u00bfEliminar permanentemente? Esta acci\u00f3n no se puede deshacer.")) return;
    try {
      if (type === "note") await permanentDeleteNote(id);
      else await permanentDeleteCollection(id);
      await loadTrash();
      if (onRefreshSidebar) onRefreshSidebar();
      if (type === "note") {
        setSelectedNote(null);
        setNotePreview(null);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const toggleCollection = (id) => {
    setExpandedCollections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return trashItems.notes;
    const q = searchQuery.toLowerCase();
    return trashItems.notes.filter((n) => (n.title || "").toLowerCase().includes(q));
  }, [trashItems.notes, searchQuery]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return trashItems.collections;
    const q = searchQuery.toLowerCase();
    return trashItems.collections.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [trashItems.collections, searchQuery]);

  const notesByCollection = useMemo(() => {
    const map = { "no-collection": [] };
    (filteredNotes || []).forEach((note) => {
      if (note.parentDeleted && note.collectionId?._id) {
        const colId = note.collectionId._id;
        if (!map[colId]) map[colId] = [];
        map[colId].push(note);
      } else {
        map["no-collection"].push(note);
      }
    });
    return map;
  }, [filteredNotes]);

  const renderNoteItem = (note) => {
    const days = getDaysRemaining(note.deletedAt);
    const isSelected = selectedNote?._id === note._id;
    return (
      <div
        key={note._id}
        className={`trash-modal-note-item ${isSelected ? "active" : ""}`}
        onClick={() => setSelectedNote({ _id: note._id, isDeleted: true, parentDeleted: note.parentDeleted })}
      >
        <div className="trash-item-icon">{note.emoji || '\uD83D\uDCC4'}</div>
        <div className="trash-item-info">
          <div className="trash-item-name">{note.title || 'Sin t\u00edtulo'}</div>
          <div className="trash-item-date">
            {formatDate(note.deletedAt)}
            {days > 0 ? ` \u00B7 ${days} d\u00eda${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}` : ' \u00B7 Hoy'}
          </div>
        </div>
        <div className="trash-item-actions">
          {!note.parentDeleted && (
            <button className="trash-item-btn" onClick={(e) => { e.stopPropagation(); handleRestore("note", note._id); }} title="Restaurar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </button>
          )}
          <button className="trash-item-btn trash-item-btn-delete" onClick={(e) => { e.stopPropagation(); handlePermanentDelete("note", note._id); }} title="Eliminar permanentemente">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedNote || !notePreview) return null;
    const days = getDaysRemaining(notePreview.deletedAt);
    const parentDeleted = selectedNote.parentDeleted;
    return (
      <div className="trash-modal-preview">
        <div className="trash-modal-preview-header">
          <button className="trash-modal-back" onClick={() => { setSelectedNote(null); setNotePreview(null); }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        </div>
        <div className="trash-modal-preview-banner">
          <div className="trash-modal-preview-info">
            {notePreview.emoji && <span className="trash-preview-emoji">{notePreview.emoji}</span>}
            <div className="trash-preview-text">
              <span className="trash-preview-title">{notePreview.title || 'Sin t\u00edtulo'}</span>
              <span className="trash-preview-meta">
                {parentDeleted
                  ? 'Pertenece a una colecci\u00f3n en la Papelera. Restaura la colecci\u00f3n.'
                  : `Moviste esta p\u00e1gina el ${formatDate(notePreview.deletedAt)}.${days > 0 ? ` Se eliminar\u00e1 en ${days} d\u00eda${days !== 1 ? 's' : ''}.` : ' Se eliminar\u00e1 hoy.'}`}
              </span>
            </div>
          </div>
          <div className="trash-preview-actions">
            {!parentDeleted && (
              <button className="trash-btn-restore" onClick={() => handleRestore("note", notePreview._id)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Restore page
              </button>
            )}
            <button className="trash-btn-delete" onClick={() => handlePermanentDelete("note", notePreview._id)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Permanently delete
            </button>
          </div>
        </div>
        <div className="trash-modal-preview-content">
          <div className="trash-preview-title-area">
            {notePreview.emoji && <span className="editor-emoji-display">{notePreview.emoji}</span>}
            <div className="editor-title-viewonly">{notePreview.title || 'Sin t\u00edtulo'}</div>
          </div>
          <div className="trash-preview-blocks">
            {notePreview.content && notePreview.content.map((block, i) => (
              <div key={i} className="trash-block">
                {block.content && block.content.map((inline, j) => (
                  <span key={j}>{inline.text || ""}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModalPortal>
      <div className="trash-modal-overlay" onClick={() => { setSelectedNote(null); setNotePreview(null); onClose(); }}>
        <div className="trash-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="trash-modal-topbar">
            <div className="trash-modal-topbar-left">
              <span className="trash-modal-icon">{'\uD83D\uDDD1\uFE0F'}</span>
              <h2 className="trash-modal-title">Papelera</h2>
            </div>
            <div className="trash-modal-topbar-right">
              <button className="trash-modal-btn" onClick={loadTrash} title="Actualizar" disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button className="trash-modal-close" onClick={onClose} title="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {selectedNote && notePreview ? renderPreview() : (
            <>
              <div className="trash-modal-search">
                <input
                  className="trash-search-input"
                  type="text"
                  placeholder="Buscar en la Papelera..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="trash-modal-body">
                {loading ? (
                  <div className="trash-loading">Cargando...</div>
                ) : filteredNotes.length === 0 && filteredCollections.length === 0 ? (
                  <div className="trash-empty">
                    <p>No hay elementos en la papelera</p>
                  </div>
                ) : (
                  <div className="trash-modal-list">
                    {filteredCollections.map((col) => {
                      const colNotes = notesByCollection[col._id] || [];
                      const isExpanded = !!expandedCollections[col._id];
                      const days = getDaysRemaining(col.deletedAt);
                      return (
                        <div key={col._id} className="trash-modal-collection">
                          <div className="trash-modal-collection-header" onClick={() => toggleCollection(col._id)}>
                            <span className={`trash-modal-chevron ${isExpanded ? "expanded" : ""}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                              </svg>
                            </span>
                            <span className="trash-modal-col-icon">{'\uD83D\uDCC1'}</span>
                            <span className="trash-modal-col-name">{col.name}</span>
                            <span className="trash-modal-col-meta">
                              {formatDate(col.deletedAt)}
                              {days > 0 ? ` \u00B7 ${days} d\u00eda${days !== 1 ? 's' : ''}` : ' \u00B7 Hoy'}
                            </span>
                            <div className="trash-item-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="trash-item-btn" onClick={() => handleRestore("collection", col._id)} title="Restaurar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                              </button>
                              <button className="trash-item-btn trash-item-btn-delete" onClick={() => handlePermanentDelete("collection", col._id)} title="Eliminar permanentemente">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {isExpanded && colNotes.length > 0 && (
                            <div className="trash-modal-col-notes">
                              {colNotes.map(renderNoteItem)}
                            </div>
                          )}
                          {isExpanded && colNotes.length === 0 && (
                            <div className="trash-modal-col-empty">No hay notas en esta colecci\u00f3n</div>
                          )}
                        </div>
                      );
                    })}
                    {notesByCollection["no-collection"] && notesByCollection["no-collection"].length > 0 && (
                      <div className="trash-modal-section">
                        <div className="trash-modal-section-title">Notas individuales</div>
                        {notesByCollection["no-collection"].map(renderNoteItem)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="trash-modal-footer">
            <p>Una vez que una colección o nota esté en la Papelera durante 30 días, se eliminará automáticamente.</p>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TrashView;