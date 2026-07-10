import { useState, useEffect } from "react";
import { getPublicNote } from "../services/api";
import { useParams, Link } from "react-router-dom";

const PublicNote = () => {
  const { publicId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const data = await getPublicNote(publicId);
        setNote(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [publicId]);

  if (loading) return <div className="public-note-loading">Cargando...</div>;
  if (error || !note) return (
    <div className="public-error-page">
      <img src="/images/empty.png" alt="" className="public-error-img public-error-img--light" />
      <img src="/images/empty-dark.png" alt="" className="public-error-img public-error-img--dark" />
      <h2 className="public-error-title">Ups! Ocurrió un error</h2>
      <p className="public-error-desc">Esta nota ya no está publicada o no existe.</p>
      <Link to="/login" className="public-error-btn">Ir a Notes</Link>
    </div>
  );

  const renderBlocks = (blocks) => (
    <div className="public-note-content">
      {blocks?.map((block, i) => {
        if (block.type === 'divider') {
          return <hr key={i} className="public-divider" />;
        }
        if (block.type === 'image') {
          return <img key={i} className="public-image" src={block.props?.url} alt="" />;
        }
        const inlineContent = Array.isArray(block.content) ? block.content : [];
        return (
          <div key={i} className="public-block">
            {inlineContent.length > 0 ? inlineContent.map((inline, j) => (
              <span key={j} className="public-inline">
                {inline.text || ""}
              </span>
            )) : <br />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="public-note-page">
      <nav className="public-navbar">
        <span className="public-navbar-title">
          {note.emoji && <span className="public-navbar-emoji">{note.emoji}</span>}
          {note.title || "Sin título"}
        </span>
        <Link to="/login" className="public-navbar-login">Ir a Notes</Link>
      </nav>
      {note.coverUrl && (
        <div
          className="public-note-cover"
          style={{
            backgroundImage: `url(${note.coverUrl})`,
            backgroundPosition: `50% ${note.coverPosition || 0}%`,
          }}
        />
      )}
      <div className={`public-note-header${!note.emoji ? ' no-emoji' : ''}`}>
        {note.emoji && <span className="public-note-emoji">{note.emoji}</span>}
        <h1 className="public-note-title">{note.title || "Sin título"}</h1>
      </div>
      {renderBlocks(note.content)}
    </div>
  );
};

export default PublicNote;