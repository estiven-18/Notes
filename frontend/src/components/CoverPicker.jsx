import { useState, useRef, useEffect } from "react";
import { uploadFile, updateCover } from "../services/api";

const CoverPicker = ({ noteId, coverUrl, coverPosition, onCoverChange, compact }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState(coverPosition || 0);
  const [hovering, setHovering] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
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
      if (onCoverChange) onCoverChange(url, position);
      setMenuOpen(false);
      updateCover(noteId, url, position).catch(() => {});
    } catch (err) {
      alert("Error al subir imagen: " + err.message);
    }
  };

  const handleRemove = async () => {
    if (onCoverChange) onCoverChange(null, 0);
    setMenuOpen(false);
    updateCover(noteId, null, 0).catch(() => {});
  };

  if (!coverUrl) {
    if (compact) {
      return (
        <span className="cover-btn-wrap" ref={menuRef}>
          <button className="cover-title-btn" onClick={() => setMenuOpen(!menuOpen)} title="Agregar portada">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
            </svg>
            <span>Agregar portada</span>
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
          <label className="cover-overlay-btn">
            Cambiar portada
            <input type="file" accept="image/*" onChange={handleUpload} hidden />
          </label>
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
            className="cover-reposition-slider"
          />
          <button
            className="cover-overlay-btn cover-reposition-done"
            onClick={() => {
              if (position !== coverPosition) {
                if (onCoverChange) onCoverChange(coverUrl, position);
                updateCover(noteId, coverUrl, position).catch(() => {});
              }
              setRepositioning(false);
            }}
          >
            Listo
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverPicker;
