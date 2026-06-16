import { useState } from "react";

const ShareNoteModal = ({ note, onShare, onRemoveShare, onClose }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onShare(note._id, email.trim());
      setEmail("");
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
          <h3 className="modal-title">Compartir nota: {note.title || 'Sin título'}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="modal-input"
            type="email"
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          {error && <p className="share-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-confirm"
              disabled={!email.trim() || loading}
            >
              {loading ? "Compartiendo..." : "Compartir"}
            </button>
          </div>
        </form>
        {note.sharedWith && note.sharedWith.length > 0 && (
          <div className="shared-users-list">
            <p className="shared-users-title">Compartido con:</p>
            {note.sharedWith.map((user) => (
              <div key={user._id} className="shared-user-row">
                <span className="shared-user-name">{user.name} ({user.email})</span>
                <button
                  className="shared-user-remove"
                  onClick={() => onRemoveShare(note._id, user._id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareNoteModal;
