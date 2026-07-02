import { useState, useEffect, useMemo, useCallback } from "react";
import { getTrashItems, restoreNote, permanentDeleteNote, restoreCollection, permanentDeleteCollection } from "../services/api";
import ModalPortal from "./ModalPortal";
import ConfirmModal from "./ConfirmModal";

const TRASH_EXPIRY_DAYS = 30;

const TrashView = ({ onClose, onRefreshSidebar, onNoteRestored }) => {
  const [trashItems, setTrashItems] = useState({ notes: [], collections: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCollections, setExpandedCollections] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTrash();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTrash]);

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

  const handlePermanentDelete = async (type, id, itemName) => {
    const name = itemName || (type === 'note' ? 'esta nota' : 'esta colección');
    setConfirmModal({
      title: "¿Eliminar permanentemente?",
      message: `Se eliminará "${name}" permanentemente. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar permanentemente",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
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
      },
    });
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
    return (
      <div
        key={note._id}
        className="trash-modal-note-item"
      >
        <div className="trash-item-icon">
          {note.emoji ? (
            <span className="trash-emoji">{note.emoji}</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#999" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          )}
        </div>
        <div className="trash-item-name">{note.title || 'Sin título'}</div>
        <div className="trash-item-date">
          {formatDate(note.deletedAt)}
          {days > 0 ? ` · ${days} día${days !== 1 ? 's' : ''}` : ' · Hoy'}
        </div>
        <div className="trash-item-actions">
          {!note.parentDeleted && (
            <button className="trash-item-btn" onClick={(e) => { e.stopPropagation(); handleRestore("note", note._id); }} title="Restaurar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </button>
          )}
          <button className="trash-item-btn trash-item-btn-delete" onClick={(e) => { e.stopPropagation(); handlePermanentDelete("note", note._id, note.title); }} title="Eliminar permanentemente">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
    <ModalPortal>
      <div className="trash-modal-overlay" onClick={onClose}>
        <div className="trash-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="trash-modal-topbar">
            <div className="trash-modal-topbar-left">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <h2 className="trash-modal-title">Papelera</h2>
            </div>
            <div className="trash-modal-topbar-right">
              <button className="trash-modal-close" onClick={onClose} title="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

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
                            <span className="trash-modal-col-icon">
                              {col.emoji ? (
                                <span className="trash-emoji">{col.emoji}</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#999" width="16" height="16">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                                </svg>
                              )}
                            </span>
                            <span className="trash-modal-col-name">{col.name}</span>
                            <span className="trash-modal-col-meta">
                              {formatDate(col.deletedAt)}
                              {days > 0 ? ` · ${days} día${days !== 1 ? 's' : ''}` : ' · Hoy'}
                            </span>
                            <div className="trash-item-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="trash-item-btn" onClick={() => handleRestore("collection", col._id)} title="Restaurar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                              </button>
                              <button className="trash-item-btn trash-item-btn-delete" onClick={() => handlePermanentDelete("collection", col._id, col.name)} title="Eliminar permanentemente">
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
                            <div className="trash-modal-col-empty">No hay notas en esta colección</div>
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

          <div className="trash-modal-footer">
            <p>Una vez que una colección o nota esté en la Papelera durante 30 días, se eliminará automáticamente.</p>
          </div>
        </div>
      </div>
    </ModalPortal>

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
  </>
  );
};

export default TrashView;