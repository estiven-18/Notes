import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCollections,
  getSharedCollections,
  createCollection,
} from "../services/api";


const tabs = [
  { id: "all", label: "Recents" },
  { id: "favorites", label: "Favorites" },
  { id: "shared", label: "Shared" },
  { id: "private", label: "Private" },
  { id: "public", label: "Public" },
];

const Library = ({ noteRefreshKey, onCollectionCreated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const [allCols, sharedCols] = await Promise.all([
          getCollections(),
          getSharedCollections().catch(() => []),
        ]);
        const merged = [...(allCols || [])];
        (sharedCols || []).forEach(sc => {
          if (!merged.find(c => c._id === sc._id)) merged.push({ ...sc, _sharedWithMe: true });
        });
        if (!cancelled) setCollections(merged);
      } catch (err) {
        console.error("Error loading library:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [location.pathname, noteRefreshKey]);

  const getFilteredCollections = () => {
    switch (activeTab) {
      case "favorites":
        return collections.filter((c) => c.isFavorite);
      case "shared":
        return collections.filter((c) => c._sharedWithMe || (c.sharedWith && c.sharedWith.length > 0));
      case "private":
        return collections.filter(
          (c) => !c.isPublic && !c._sharedWithMe && !(c.sharedWith && c.sharedWith.length > 0)
        );
      case "public":
        return collections.filter((c) => c.isPublic);
      case "all":
        return collections;
      default:
        return collections;
    }
  };

  const filteredCollections = getFilteredCollections();

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
        <h1 className="library-title">Biblioteca</h1>
        <button
          className="library-new-page-btn"
          onClick={async () => {
            try {
              const col = await createCollection('');
              onCollectionCreated?.();
              navigate(`/collection/${col._id}`);
            } catch (err) {
              alert("Error al crear colección: " + err.message);
            }
          }}
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
            {tab.id === "all" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            )}
            {tab.id === "favorites" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            )}
            {tab.id === "shared" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )}
            {tab.id === "private" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
            {tab.id === "public" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )}
            {tab.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="library-loading">Cargando...</div>
      ) : filteredCollections.length === 0 ? (
        <div className="library-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 80 }}>
          <div className="library-empty-icon" style={{ marginBottom: 8 }}>
            <img src="/images/empty.png" alt="Vacío" className="library-empty-img library-empty-img--light" style={{ maxWidth: 400 }} />
            <img src="/images/empty-dark.png" alt="Vacío" className="library-empty-img library-empty-img--dark" style={{ maxWidth: 400 }} />
          </div>
          <p className="library-empty-title" style={{ textAlign: 'center', margin: 0, color: '#999', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>no hay colecciones aquí.<br/>crea una nueva colección para empezar.</p>
        </div>
      ) : (
        <div className="library-table-wrapper">
          <table className="library-table">
            <thead>
              <tr>
                <th className="library-th">Nombre de página</th>
                <th className="library-th">Última edición</th>
                <th className="library-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((col) => (
                <tr
                  key={col._id}
                  className="library-row"
                  onClick={() => navigate(`/collection/${col._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="library-td library-note-name">
                    <span className="library-note-link">
                      {col.emoji && <span className="library-note-emoji">{col.emoji}</span>}
                      {col.name || "Sin título"}
                    </span>
                  </td>
                  <td className="library-td library-time">{getRelativeTime(col.updatedAt)}</td>
                  <td className="library-td">
                    <div className="library-badges">
                      {col.isPublic && <span className="library-badge library-badge-public">Pública</span>}
                      {(col._sharedWithMe || (col.sharedWith && col.sharedWith.length > 0)) && <span className="library-badge library-badge-shared">Compartida</span>}
                      {!col.isPublic && !(col._sharedWithMe || (col.sharedWith && col.sharedWith.length > 0)) && <span className="library-badge library-badge-private">Privada</span>}
                      {col.isFavorite && <span className="library-badge library-badge-fav">⭐ Favorita</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Library;
