import { useState, useEffect, useRef } from "react";
import { searchNotes } from "../services/api";
import ModalPortal from "./ModalPortal";

const emptyResults = { collections: [], notes: [] };

const SearchModalContent = ({ onClose, onSelectNote, onSelectCollection }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(emptyResults);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchNotes(trimmedQuery);
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults({ collections: [], notes: [] });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const allItems = [
    ...results.notes.map((n) => ({ ...n, _type: "note" })),
    ...results.collections.map((c) => ({ ...c, _type: "collection" })),
  ];

  const handleChange = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      setResults(emptyResults);
      setSelectedIndex(0);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && allItems[selectedIndex]) {
      const item = allItems[selectedIndex];
      if (item._type === "note") {
        onSelectNote(item);
        onClose();
      } else if (item._type === "collection") {
        onSelectCollection(item);
        onClose();
      }
    }
  };

  return (
    <ModalPortal>
      <div className="search-modal-overlay" onClick={onClose}>
        <div className="search-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-modal-input-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#999" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607" />
            </svg>
            <input
              ref={inputRef}
              className="search-modal-input"
              type="text"
              placeholder={`Buscar notas y colecciones...`}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="search-modal-body">
            <div className="search-modal-results">
              {loading && <div className="search-modal-loading">Buscando...</div>}
              {!loading && query.trim() && allItems.length === 0 && (
                <div className="search-modal-empty">Sin resultados</div>
              )}
              {!loading && allItems.length > 0 && (
                <>
                  <div className="search-modal-date-group">
                    <div className="search-modal-date-label">Hoy</div>
                    {allItems.map((item, idx) => (
                      <div
                        key={item._id}
                        className={`search-modal-result-item ${idx === selectedIndex ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedIndex(idx);
                          if (item._type === "note") {
                            onSelectNote(item);
                            onClose();
                          } else if (item._type === "collection") {
                            onSelectCollection(item);
                            onClose();
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="search-modal-result-icon">
                          {item._type === "note" ? (
                            item.emoji || (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#999" width="14" height="14">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                              </svg>
                            )
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#999" width="14" height="14">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                            </svg>
                          )}
                        </span>
                        <div className="search-modal-result-info">
                          <span className="search-modal-result-title">{item._type === "collection" ? (item.name || "Sin nombre") : (item.title || "Sin título")}</span>
                          {item._type === "note" && item.collectionName && (
                            <span className="search-modal-result-collection"> — {item.collectionName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

const SearchModal = ({ isOpen, onClose, onSelectNote, onSelectCollection }) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <SearchModalContent
        onClose={onClose}
        onSelectNote={onSelectNote}
        onSelectCollection={onSelectCollection}
      />
    </ModalPortal>
  );
};

export default SearchModal;
