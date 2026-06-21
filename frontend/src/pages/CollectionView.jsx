import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import EmojiPicker from "../components/EmojiPicker";
import {
  getCollection,
  getNotesByCollection,
  renameCollection,
  publishCollection,
  unpublishCollection,
} from "../services/api";

const CollectionView = ({ onCollectionUpdate }) => {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameValue, setNameValue] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const titleInputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [col, colNotes] = await Promise.all([
          getCollection(collectionId),
          getNotesByCollection(collectionId),
        ]);
        setCollection(col);
        setNotes(colNotes || []);
        setNameValue(col.name);
      } catch (err) {
        console.error("Error loading collection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionId]);

  const handleSaveName = async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === collection.name) {
      setNameValue(collection.name);
      return;
    }
    try {
      const updated = await renameCollection(collectionId, trimmed, collection.emoji);
      setCollection(updated);
      onCollectionUpdate?.();
    } catch (err) {
      alert("Error al renombrar: " + err.message);
      setNameValue(collection.name);
    }
  };

  const handleEmojiSelect = async (emoji) => {
    try {
      const updated = await renameCollection(collectionId, collection.name, emoji);
      setCollection(updated);
      onCollectionUpdate?.();
    } catch (err) {
      alert("Error al cambiar emoji: " + err.message);
    }
  };

  const handleTogglePublish = async () => {
    try {
      if (collection.isPublic) {
        const updated = await unpublishCollection(collectionId);
        setCollection(updated);
      } else {
        const updated = await publishCollection(collectionId);
        setCollection(updated);
      }
    } catch (err) {
      alert("Error al cambiar visibilidad: " + err.message);
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

  if (loading) {
    return <div className="library-page"><div className="library-loading">Cargando...</div></div>;
  }

  if (!collection) {
    return <div className="library-page"><div className="library-empty">Colección no encontrada</div></div>;
  }

  return (
    <div className="library-page">
      <div className="collection-hero">
        <div className="editor-title-area">
          <div className="editor-title-tools">
            <EmojiPicker currentEmoji={collection.emoji} onSelect={handleEmojiSelect} />
          </div>
          <input
            ref={titleInputRef}
            className="editor-title-input"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => handleSaveName(nameValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName(nameValue);
              if (e.key === "Escape") {
                setNameValue(collection.name);
                titleInputRef.current?.blur();
              }
            }}
            placeholder="Sin título"
          />
        </div>
      </div>

      <div className="collection-dashboard">
        <div className="collection-stat">
          <span className="collection-stat-value">{notes.length}</span>
          <span className="collection-stat-label">{notes.length === 1 ? 'Página' : 'Páginas'}</span>
        </div>
        <div className="collection-stat">
          <span className="collection-stat-value">{collection.sharedWith?.length || 0}</span>
          <span className="collection-stat-label">{(collection.sharedWith?.length || 0) === 1 ? 'Persona' : 'Personas'}</span>
        </div>
        <div className="collection-stat">
          <span className="collection-stat-value">{collection.isPublic ? 'Sí' : 'No'}</span>
          <span className="collection-stat-label">Pública</span>
        </div>
        <div className="collection-stat">
          <span className="collection-stat-value">{notes.filter(n => n.metadata?.isFavorite).length}</span>
          <span className="collection-stat-label">Favoritas</span>
        </div>
        <button
          className={`collection-stat collection-stat-btn ${collection.isPublic ? 'collection-unpublish-btn' : 'collection-publish-btn'}`}
          onClick={handleTogglePublish}
        >
          <span className="collection-stat-value">{collection.isPublic ? '🔒' : '🌐'}</span>
          <span className="collection-stat-label">{collection.isPublic ? 'Hacer privada' : 'Hacer pública'}</span>
        </button>
      </div>

      <div className="library-table-wrapper">
        {notes.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">📄</div>
            <p className="library-empty-title">No hay páginas en esta colección</p>
            <p className="library-empty-sub">Crea una nueva página para empezar.</p>
          </div>
        ) : (
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
                <th className="library-th">Última edición</th>
                <th className="library-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note._id} className="library-row">
                  <td className="library-td library-note-name">
                    <a href={`/note/${note._id}`} className="library-note-link">
                      {note.emoji && <span className="library-note-emoji">{note.emoji}</span>}
                      {note.title || "Sin título"}
                    </a>
                  </td>
                  <td className="library-td">{note.user?.name || "—"}</td>
                  <td className="library-td library-time">{getRelativeTime(note.updatedAt)}</td>
                  <td className="library-td">
                    <div className="library-badges">
                      {note.isPublic && <span className="library-badge library-badge-public">Pública</span>}
                      {(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (collection.sharedWith && collection.sharedWith.length > 0)) && <span className="library-badge library-badge-shared">Compartida</span>}
                      {!note.isPublic && !(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (collection.sharedWith && collection.sharedWith.length > 0)) && <span className="library-badge library-badge-private">Privada</span>}
                      {note.metadata?.isFavorite && <span className="library-badge library-badge-fav">⭐</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CollectionView;
