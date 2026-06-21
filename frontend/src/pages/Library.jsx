import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAllNotes,
  createCollection,
} from "../services/api";


const tabs = [
  { id: "all", label: "Todas", icon: "📄" },
  { id: "favorites", label: "Favoritas", icon: "⭐" },
  { id: "shared", label: "Compartidas", icon: "👥" },
  { id: "private", label: "Privadas", icon: "🔒" },
];

const Library = ({ noteRefreshKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const allNotes = await getAllNotes();
        if (!cancelled) setNotes(allNotes || []);
      } catch (err) {
        console.error("Error loading library:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [location.pathname, noteRefreshKey]);

  const getFilteredNotes = () => {
    switch (activeTab) {
      case "favorites":
        return notes.filter((n) => n.metadata?.isFavorite);
      case "shared":
        return notes.filter(
          (n) => n.source === "shared" || n.source === "shared-collection" || (n.sharedWith && n.sharedWith.length > 0) || (n.collectionId?.sharedWith && n.collectionId.sharedWith.length > 0)
        );
      case "private":
        return notes.filter(
          (n) => !n.isPublic && !(n.source === "shared" || n.source === "shared-collection") && !(n.sharedWith && n.sharedWith.length > 0) && !(n.collectionId?.sharedWith && n.collectionId.sharedWith.length > 0)
        );
      case "all":
        return notes;
      default:
        return notes;
    }
  };

  const filteredNotes = getFilteredNotes();

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const col = await createCollection(newCollectionName.trim());
      setNewCollectionName("");
      setShowCreateModal(false);
      navigate(`/collection/${col._id}`);
    } catch (err) {
      alert("Error al crear colección: " + err.message);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    const diff = now - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "justo ahora";
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    return `hace ${months}m`;
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <h1 className="library-title">Library</h1>
        <button
          className="library-new-page-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Nueva colección
        </button>
      </header>

      <nav className="library-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`library-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="library-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="library-toolbar">
        <div className="library-toolbar-right">
          <button className="library-toolbar-icon" title="Buscar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="library-loading">Cargando...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon">📄</div>
          <p className="library-empty-title">No hay páginas aquí</p>
          <p className="library-empty-sub">
            Crea una nueva página para empezar.
          </p>
        </div>
      ) : (
        <div className="library-table-wrapper">
          <table className="library-table">
            <thead>
              <tr>
                <th className="library-th">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Nombre
                </th>
                <th className="library-th">Creador</th>
                <th className="library-th">Colección</th>
                <th className="library-th">Última edición</th>
                <th className="library-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr
                  key={note._id}
                  className="library-row"
                >
                  <td className="library-td library-note-name">
                    <span
                      className="library-note-link"
                      onClick={() => navigate(`/note/${note._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {note.emoji && <span className="library-note-emoji">{note.emoji}</span>}
                      {note.title || "Sin título"}
                    </span>
                  </td>
                  <td className="library-td">{note.user?.name || "—"}</td>
                  <td className="library-td">
                    {note.collectionId?.name ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {note.collectionId.emoji && <span>{note.collectionId.emoji}</span>}
                        {note.collectionId.name}
                      </span>
                    ) : "Sin colección"}
                  </td>
                  <td className="library-td library-time">{getRelativeTime(note.updatedAt)}</td>
                  <td className="library-td">
                    <div className="library-badges">
                      {note.isPublic && <span className="library-badge library-badge-public">Pública</span>}
                      {(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (note.collectionId?.sharedWith && note.collectionId.sharedWith.length > 0)) && <span className="library-badge library-badge-shared">Compartida</span>}
                      {!note.isPublic && !(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (note.collectionId?.sharedWith && note.collectionId.sharedWith.length > 0)) && <span className="library-badge library-badge-private">Privada</span>}
                      {note.metadata?.isFavorite && <span className="library-badge library-badge-fav">⭐</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>Nueva colección</h3>
            <input
              className="modal-input"
              type="text"
              placeholder="Nombre de la colección"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button className="modal-confirm-btn" onClick={handleCreateCollection}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
