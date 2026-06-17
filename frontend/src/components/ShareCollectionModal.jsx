import { useState } from "react";

const ROLES = [
  { value: 'viewer', label: 'Solo lectura' },
  { value: 'editor', label: 'Edición' },
];

const ShareCollectionModal = ({ collection, onShare, onRemoveShare, onChangeRole, onClose }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onShare(collection._id, email.trim(), role);
      setEmail("");
      setRole("editor");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Compartir: {collection.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="share-form">
          <div className="share-row">
            <input
              className="modal-input"
              type="email"
              placeholder="Email del usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <select
              className="modal-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="modal-btn modal-btn-confirm"
              disabled={!email.trim() || loading}
            >
              {loading ? "..." : "Invitar"}
            </button>
          </div>
          {error && <p className="share-error">{error}</p>}
        </form>
        {collection.sharedWith && collection.sharedWith.length > 0 && (
          <div className="shared-users-list">
            <p className="shared-users-title">Compartido con:</p>
            {collection.sharedWith.map((entry) => {
              const user = entry.user || entry;
              return (
                <div key={user._id} className="shared-user-row">
                  <span className="shared-user-name">{user.name} ({user.email})</span>
                  <select
                    className="shared-user-role-select"
                    value={entry.role || 'editor'}
                    onChange={(e) => onChangeRole(collection._id, user._id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    className="shared-user-remove"
                    onClick={() => onRemoveShare(collection._id, user._id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareCollectionModal;
