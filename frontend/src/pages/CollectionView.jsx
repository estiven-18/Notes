import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import EmojiPicker from "../components/EmojiPicker";
import {
  getCollection,
  getNotesByCollection,
  renameCollection,
} from "../services/api";

const CollectionView = ({ onCollectionUpdate }) => {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameValue, setNameValue] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const titleInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
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
        setNameValue(col.name === 'Sin título' ? '' : col.name);
        if (col.name === 'Sin título') {
          setTimeout(() => titleInputRef.current?.focus(), 100);
        }
      } catch (err) {
        console.error("Error loading collection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionId]);

  const handleSaveName = useCallback((newName) => {
    const trimmed = newName.trim();
    const saveName = trimmed || 'Sin título';
    if (!collection || saveName === collection.name) return;
    try {
      const updated = renameCollection(collectionId, saveName, collection.emoji);
      updated.then(res => {
        setCollection(res);
        setNameValue(res.name === 'Sin título' ? '' : res.name);
        onCollectionUpdate?.(res);
      });
    } catch (err) {
      console.error("Error al renombrar:", err);
    }
  }, [collection, collectionId, onCollectionUpdate]);

  const handleNameChange = useCallback((e) => {
    const newName = e.target.value;
    setNameValue(newName);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSaveName(newName), 300);
  }, [handleSaveName]);

  const handleEmojiSelect = useCallback(async (emoji) => {
    if (!collection) return;
    try {
      const updated = await renameCollection(collectionId, collection.name, emoji);
      setCollection(updated);
      onCollectionUpdate?.(updated);
    } catch (err) {
      console.error("Error al cambiar emoji:", err);
    }
  }, [collection, collectionId, onCollectionUpdate]);

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
        <div className={`editor-title-area${collection.emoji ? ' has-emoji' : ''}`}>
          <div className="editor-title-tools">
            <EmojiPicker currentEmoji={collection.emoji} onSelect={handleEmojiSelect} />
          </div>
          <input
            ref={titleInputRef}
            className="editor-title-input"
            type="text"
            value={nameValue}
            onChange={handleNameChange}
            onBlur={() => handleSaveName(nameValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                handleSaveName(nameValue);
              }
              if (e.key === "Escape") {
                setNameValue(collection.name);
                titleInputRef.current?.blur();
              }
            }}
            placeholder="Sin título"
          />
        </div>
      </div>

      <div className="library-table-wrapper">
        {notes.length === 0 ? (
          <div className="library-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 80 }}>
            <img
              src="/images/empty.png"
              alt=""
              className="library-empty-img library-empty-img--light"
              style={{ maxWidth: 400 }}
            />
            <img
              src="/images/empty-dark.png"
              alt=""
              className="library-empty-img library-empty-img--dark"
              style={{ maxWidth: 400 }}
            />
            <p className="library-empty-title" style={{ textAlign: 'center', margin: 0, color: '#999', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>no hay notas en esta colección.<br/>crea una nueva nota para empezar.</p>
          </div>
        ) : (
          <table className="library-table">
            <thead>
              <tr>
                <th className="library-th">Nombre de nota</th>
                <th className="library-th">Última edición</th>
                <th className="library-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note._id} className="library-row" onClick={() => window.location.href = `/note/${note._id}`} style={{ cursor: "pointer" }}>
                  <td className="library-td library-note-name">
                    <span className="library-note-link">
                      {note.emoji && <span className="library-note-emoji">{note.emoji}</span>}
                      {note.title || "Sin título"}
                    </span>
                  </td>
                  <td className="library-td library-time">{getRelativeTime(note.updatedAt)}</td>
                  <td className="library-td">
                    <div className="library-badges">
                      {note.isPublic && <span className="library-badge library-badge-public">Pública</span>}
                      {(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (collection.sharedWith && collection.sharedWith.length > 0)) && <span className="library-badge library-badge-shared">Compartida</span>}
                      {!note.isPublic && !(note.source === "shared" || note.source === "shared-collection" || (note.sharedWith && note.sharedWith.length > 0) || (collection.sharedWith && collection.sharedWith.length > 0)) && <span className="library-badge library-badge-private">Privada</span>}
                      {note.metadata?.isFavorite && <span className="library-badge library-badge-fav">⭐ Favorita</span>}
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
