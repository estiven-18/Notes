import { useState, useRef, useEffect } from "react";
import { uploadFile, updateCover } from "../services/api";

const CoverPicker = ({ noteId, coverUrl, coverPosition, onCoverChange, compact }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [position, setPosition] = useState(coverPosition || 0);
  const [hovering, setHovering] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowLinkInput(false);
        setLinkInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      await updateCover(noteId, url, position);
      if (onCoverChange) onCoverChange(url, position);
      setMenuOpen(false);
    } catch (err) {
      alert("Error al subir imagen: " + err.message);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) return;
    try {
      await updateCover(noteId, linkInput.trim(), position);
      if (onCoverChange) onCoverChange(linkInput.trim(), position);
      setMenuOpen(false);
      setShowLinkInput(false);
      setLinkInput("");
    } catch (err) {
      alert("Error al guardar cover: " + err.message);
    }
  };

  const handleRemove = async () => {
    try {
      await updateCover(noteId, null, 0);
      if (onCoverChange) onCoverChange(null, 0);
      setMenuOpen(false);
    } catch (err) {
      alert("Error al eliminar cover: " + err.message);
    }
  };

  if (!coverUrl) {
    if (compact) {
      return (
        <span className="cover-btn-wrap" ref={menuRef}>
          <button className="cover-title-btn" onClick={() => setMenuOpen(!menuOpen)} title="Añadir cover">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span>Añadir cover</span>
          </button>
          {menuOpen && (
            <div className="cover-menu cover-menu-compact">
              <label className="cover-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Subir imagen
                <input type="file" accept="image/*" onChange={handleUpload} hidden />
              </label>
              <button className="cover-menu-item" onClick={() => setShowLinkInput(!showLinkInput)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Enlace
              </button>
              {showLinkInput && (
                <div className="cover-link-input-wrap">
                  <input
                    className="cover-link-input"
                    type="text"
                    placeholder="Pega un enlace de imagen..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                    autoFocus
                  />
                  <button className="cover-link-submit" onClick={handleLinkSubmit}>✓</button>
                </div>
              )}
            </div>
          )}
        </span>
      );
    }
    return null;
  }

  return (
    <div
      className="cover-wrapper"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="cover-image"
        style={{
          backgroundImage: `url(${coverUrl})`,
          backgroundPosition: `50% ${position}%`,
        }}
      />
      {hovering && !repositioning && (
        <div className="cover-overlay">
          <button className="cover-overlay-btn" onClick={() => setMenuOpen(!menuOpen)}>
            Cambiar cover
          </button>
          <button className="cover-overlay-btn" onClick={() => setRepositioning(true)}>
            Reposicionar
          </button>
          <button className="cover-overlay-btn cover-remove-btn" onClick={handleRemove}>
            Quitar
          </button>
        </div>
      )}
      {repositioning && (
        <div className="cover-reposition-bar">
          <span className="cover-reposition-label">Arrastra para reposicionar</span>
          <input
            type="range"
            min="-100"
            max="100"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            onMouseUp={async () => {
              if (position !== coverPosition) {
                try {
                  await updateCover(noteId, coverUrl, position);
                  if (onCoverChange) onCoverChange(coverUrl, position);
                } catch {}
              }
            }}
            className="cover-reposition-slider"
          />
          <button className="cover-overlay-btn cover-reposition-done" onClick={() => setRepositioning(false)}>
            Listo
          </button>
        </div>
      )}
      {menuOpen && (
        <div className="cover-menu cover-menu-above" ref={menuRef}>
          <label className="cover-menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Subir imagen
            <input type="file" accept="image/*" onChange={handleUpload} hidden />
          </label>
          <button className="cover-menu-item" onClick={() => setShowLinkInput(!showLinkInput)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Enlace
          </button>
          {showLinkInput && (
            <div className="cover-link-input-wrap">
              <input
                className="cover-link-input"
                type="text"
                placeholder="Pega un enlace de imagen..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                autoFocus
              />
              <button className="cover-link-submit" onClick={handleLinkSubmit}>✓</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverPicker;
