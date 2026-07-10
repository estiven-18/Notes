import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from "react";
import { useSelector } from "react-redux";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getNoteById, updateNoteById, toggleFavorite, shareNote, removeNoteShare, changeNoteShareRole, uploadFile, publishNote, unpublishNote } from "../services/api";
import { es } from "@blocknote/core/locales";
import SavingIndicator from "./SavingIndicator";
import EmojiPicker from "./EmojiPicker";
import ShareNoteModal from "./ShareNoteModal";
import ModalPortal from "./ModalPortal";
import CoverPicker from "./CoverPicker";
const userColors = [
  "#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#38d9a9",
  "#4dabf7", "#748ffc", "#da77f2", "#f783ac", "#63e6be",
];

const NotionEditor = ({ noteId, onTitleChange, onEmojiChange, onFavoriteToggle, onShareChange, sidebarOpen, onToggleSidebar, onCreateCollection }) => {
  const currentUser = useSelector((state) => state.auth.user);

  if (!noteId) {
    return (
      <div className="editor-empty">
        <img
          src="/images/reading.png"
          alt=""
          className="editor-empty-img editor-empty-img--light"
        />
        <img
          src="/images/reading-dark.png"
          alt=""
          className="editor-empty-img editor-empty-img--dark"
        />
        <div className="editor-empty-text">
          Selecciona una nota de la barra lateral o crea una nueva
        </div>
        <button className="editor-empty-btn" onClick={onCreateCollection}>
          Nueva colección
        </button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <EditorInner
        key={noteId}
        noteId={noteId}
        currentUser={currentUser}
        onTitleChange={onTitleChange}
        onEmojiChange={onEmojiChange}
        onFavoriteToggle={onFavoriteToggle}
        onShareChange={onShareChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
    </div>
  );
};

const EditorInner = ({ noteId, currentUser, onTitleChange, onEmojiChange, onFavoriteToggle, onShareChange, sidebarOpen, onToggleSidebar }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [noteSharedWith, setNoteSharedWith] = useState([]);
  const [userRole, setUserRole] = useState('viewer');
  const [isPublic, setIsPublic] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [shareTab, setShareTab] = useState("compartir");
  const [shareEmail, setShareEmail] = useState("");
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverPosition, setCoverPosition] = useState(0);
  const [noteInfo, setNoteInfo] = useState(null);
  const titleTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const titleInputRef = useRef(null);
  const loadedContentRef = useRef(null);
  const userEditedRef = useRef(false);

  const markSaved = useCallback(() => {
    setLastSaved(Date.now());
    setNoteInfo((prev) => prev ? { ...prev, lastUpdatedBy: currentUser, updatedAt: new Date().toISOString() } : prev);
  }, [currentUser]);

  const WS_URL = import.meta.env.VITE_WS_URL || `http://localhost:3001`;

  useEffect(() => {
    if (!showShareDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest('.share-dropdown-wrapper')) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShareDropdown]);

  const { ydoc, provider } = useMemo(() => {
    const y = new Y.Doc();
    const p = new WebsocketProvider(WS_URL, `note-${noteId}`, y);
    return { ydoc: y, provider: p };
  }, [noteId, WS_URL]);

  const userColor = useMemo(() => {
    if (!currentUser?._id) return userColors[0];
    let hash = 0;
    for (let i = 0; i < currentUser._id.length; i++) {
      hash = currentUser._id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return userColors[Math.abs(hash) % userColors.length];
  }, [currentUser]);

  const editor = useCreateBlockNote({
    dictionary: es,
    uploadFile,
    collaboration: {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: currentUser?.name || "Anónimo",
        color: userColor,
      },
      showCursorLabels: "activity",
    },
  }, [noteId]);

  const doSave = useCallback(async () => {
    if (!editor || isSavingRef.current || !userEditedRef.current) return;
    const doc = editor.document;
    const contentStr = JSON.stringify(doc);
    if (contentStr === loadedContentRef.current) return;
    isSavingRef.current = true;
    try {
      await updateNoteById(noteId, { content: doc });
      loadedContentRef.current = contentStr;
      markSaved();
    } catch (err) {
      if (err.message?.includes('No tienes permisos')) {
        try {
          const note = await getNoteById(noteId);
          const role = note.userRole || 'viewer';
          editor.isEditable = role === 'owner' || role === 'editor';
          setUserRole(role);
        } catch {/*ignore*/}
      }
      console.error("Error al guardar:", err);
    } finally {
      isSavingRef.current = false;
    }
  }, [noteId, editor, markSaved]);

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    userEditedRef.current = false;
    (async () => {
      try {
        const note = await getNoteById(noteId);
        if (cancelled) return;
        const role = note.userRole || 'owner';
        editor.isEditable = role === 'owner' || role === 'editor';
        startTransition(() => {
          setTitle(note.title === "Sin título" ? "" : note.title);
          setEmoji(note.emoji || null);
          setIsFavorite(note.metadata?.isFavorite || false);
          setIsPublic(note.isPublic || false);
          setPublicUrl(note.publicId ? window.location.origin + `/public/${note.publicId}` : null);
          setCoverUrl(note.coverUrl || null);
          setCoverPosition(note.coverPosition || 0);
          const shared = (note.sharedWith && note.sharedWith.length > 0) ? note.sharedWith : (note.collectionSharedWith || []);
          setNoteSharedWith(shared);
          setUserRole(role);
          setLastSaved(new Date(note.updatedAt).getTime());
          setNoteInfo({ author: note.user, lastUpdatedBy: note.lastUpdatedBy || note.user, user: note.user, createdAt: note.createdAt, updatedAt: note.updatedAt });
        });
        if (note.content && note.content.length > 0) {
          editor.replaceBlocks(editor.document, note.content);
        } else {
          editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
        }
        loadedContentRef.current = JSON.stringify(editor.document);
        userEditedRef.current = false;
      } catch (err) {
        if (!cancelled) startTransition(() => setError(err.message));
      } finally {
        if (!cancelled) startTransition(() => setIsLoading(false));
      }
    })();
    return () => { cancelled = true; };
  }, [editor, noteId]);

  useEffect(() => {
    if (editor && userRole) {
      editor.isEditable = userRole === 'owner' || userRole === 'editor';
    }
  }, [editor, userRole]);

  useEffect(() => {
    if (!isLoading && (!title || title === 'Sin título') && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isLoading, title]);

  useEffect(() => {
    const interval = setInterval(() => doSave(), 2000);
    return () => { clearInterval(interval); };
  }, [doSave]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      const finalTitle = newTitle.trim() || 'Sin título';
      if (onTitleChange) onTitleChange(noteId, finalTitle);
      try {
        await updateNoteById(noteId, { title: finalTitle });
        setTitle(finalTitle === "Sin título" ? "" : finalTitle);
        markSaved();
      } catch (err) {
        console.error("Error al guardar título:", err);
        if (err.message?.includes('No tienes permisos')) {
          try {
            const note = await getNoteById(noteId);
            const role = note.userRole || 'viewer';
            editor.isEditable = role === 'owner' || role === 'editor';
            setUserRole(role);
          } catch {/*ignore*/}
        }
      }
    }, 500);
  };

  const handleCoverChange = (url, position) => {
    setCoverUrl(url);
    setCoverPosition(position || 0);
    markSaved();
  };

  const handleEmojiSelect = async (newEmoji) => {
    setEmoji(newEmoji);
    markSaved();
    if (onEmojiChange) onEmojiChange(noteId, newEmoji);
    try {
      await updateNoteById(noteId, { emoji: newEmoji });
    } catch (err) {
      console.error("Error al guardar emoji:", err);
      if (err.message?.includes('No tienes permisos')) {
        try {
          const note = await getNoteById(noteId);
          const role = note.userRole || 'viewer';
          editor.isEditable = role === 'owner' || role === 'editor';
          setUserRole(role);
        } catch {/*ignore*/}
      }
    }
  };

  const handleFavoriteClick = async () => {
    try {
      const updated = await toggleFavorite(noteId);
      const newFav = updated.metadata?.isFavorite || false;
      setIsFavorite(newFav);
      if (onFavoriteToggle) onFavoriteToggle();
    } catch (err) {
      console.error("Error al cambiar favorito:", err);
    }
  };

  const handleShareNote = async (nid, email, role = 'editor') => {
    const updated = await shareNote(nid, email, role);
    setNoteSharedWith(updated.sharedWith || []);
    onShareChange?.();
  };

  const handleRemoveNoteShare = async (nid, userId) => {
    const updated = await removeNoteShare(nid, userId);
    setNoteSharedWith(updated.sharedWith || []);
    onShareChange?.();
  };

  const handleChangeNoteShareRole = async (nid, userId, role) => {
    const updated = await changeNoteShareRole(nid, userId, role);
    setNoteSharedWith(updated.sharedWith || []);
  };

  const handlePublish = async () => {
    try {
      const data = await publishNote(noteId);
      setIsPublic(true);
      const fullUrl = window.location.origin + data.publicUrl;
      setPublicUrl(fullUrl);
    } catch (err) {
      alert("Error al publicar: " + err.message);
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishNote(noteId);
      setIsPublic(false);
      setPublicUrl(null);
    } catch (err) {
      alert("Error al despublicar: " + err.message);
    }
  };

  if (error) {
    return (
      <div className="editor-empty">
        <img src={document.documentElement.getAttribute('data-theme') === 'dark' ? '/images/error-dark.png' : '/images/error.png'} alt="Error" className="editor-empty-img" />
        <p>Ups! Nota no encontrada</p>
      </div>
    );
  }

  return (
    <>
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          {!sidebarOpen && (
            <button
              className="editor-star-btn sidebar-expand-btn-inline"
              onClick={onToggleSidebar}
              title="Mostrar sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
          <span className="editor-topbar-brand">
            {emoji && <span className="editor-topbar-emoji">{emoji}</span>}
            {title || 'Sin título'}
          </span>
          <span className={`editor-topbar-status ${isPublic ? "public" : "private"}`}>
            {isPublic ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Pública
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Privada
              </>
            )}
          </span>
        </div>
        <div className="editor-topbar-right">
          <SavingIndicator lastSaved={lastSaved} note={noteInfo} />
          {userRole === 'owner' && (
            <span className="share-dropdown-wrapper">
              <button
                className="share-dropdown-btn"
                onClick={() => setShowShareDropdown(!showShareDropdown)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z" />
                </svg>
                Compartir
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#000" width="12" height="12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showShareDropdown && (
                <div className="share-dropdown-panel">
                  <div className="share-dropdown-tabs">
                    <button
                      className={`share-dropdown-tab ${shareTab === "compartir" ? "active" : ""}`}
                      onClick={() => setShareTab("compartir")}
                    >
                      Compartir
                    </button>
                    <button
                      className={`share-dropdown-tab ${shareTab === "publicar" ? "active" : ""}`}
                      onClick={() => setShareTab("publicar")}
                    >
                      Publicar
                    </button>
                  </div>
                  {shareTab === "compartir" && (
                    <div className="share-dropdown-body">
                      <div className="share-dropdown-input-row">
                        <input
                          className="share-dropdown-input"
                          type="email"
                          placeholder="Correo electrónico del invitado"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && shareEmail.trim()) {
                              try {
                                await handleShareNote(noteId, shareEmail.trim(), 'editor');
                                setShareEmail("");
                              } catch {/**/}
                            }
                          }}
                        />
                        <button
                          className="share-dropdown-invite-btn"
                          onClick={async () => {
                            if (shareEmail.trim()) {
                              try {
                                await handleShareNote(noteId, shareEmail.trim(), 'editor');
                                setShareEmail("");
                              } catch {/**/}
                            }
                          }}
                          disabled={!shareEmail.trim()}
                        >
                          Invitar
                        </button>
                      </div>
                      <div className="share-dropdown-users">
                        <div className="share-dropdown-user">
                          <span className="share-dropdown-avatar" style={{ backgroundColor: '#e8e8e6', color: '#555' }}>
                            {(currentUser?.name || '?').charAt(0).toUpperCase()}
                          </span>
                          <div className="share-dropdown-user-info">
                            <span className="share-dropdown-user-name">{currentUser?.name} <span className="share-dropdown-you">(Tú)</span></span>
                            <span className="share-dropdown-user-email">{currentUser?.email}</span>
                          </div>
                          <span className="share-dropdown-role">Acceso completo</span>
                        </div>
                        {noteSharedWith.map((s) => {
                          const user = s.user || s;
                          return (
                            <div key={user._id} className="share-dropdown-user">
                              <span className="share-dropdown-avatar" style={{ backgroundColor: '#e8e8e6', color: '#555' }}>
                                {(user.name || '?').charAt(0).toUpperCase()}
                              </span>
                              <div className="share-dropdown-user-info">
                                <span className="share-dropdown-user-name">{user.name}</span>
                                <span className="share-dropdown-user-email">{user.email}</span>
                              </div>
                              <select
                                className="share-dropdown-role-select"
                                value={s.role || 'editor'}
                                onChange={(e) => handleChangeNoteShareRole(noteId, user._id, e.target.value)}
                              >
                                <option value="editor">Edición</option>
                                <option value="viewer">Solo lectura</option>
                              </select>
                              <button
                                className="share-dropdown-remove"
                                onClick={() => handleRemoveNoteShare(noteId, user._id)}
                                title="Quitar acceso"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {shareTab === "publicar" && (
                    <div className="share-dropdown-body">
                      <div className="share-dropdown-publish">
                        {isPublic ? (
                          <>
                            <p className="share-dropdown-publish-desc">
                              Compartir a través de un enlace público
                            </p>
                            {publicUrl && (
                              <div className="share-dropdown-public-url">
                                <input
                                  className="share-dropdown-public-input"
                                  type="text"
                                  value={publicUrl}
                                  readOnly
                                  onFocus={(e) => e.target.select()}
                                />
                                <button
                                  className="share-dropdown-copy-btn"
                                  onClick={(e) => {
                                    navigator.clipboard.writeText(publicUrl);
                                    e.target.textContent = '¡Copiado!';
                                    setTimeout(() => { e.target.textContent = 'Copiar'; }, 2000);
                                  }}
                                >
                                  Copiar
                                </button>
                              </div>
                            )}
                            <div className="share-dropdown-publish-actions">
                              <button
                                className="share-dropdown-publish-btn-outline"
                                onClick={handleUnpublish}
                              >
                                Deshacer
                              </button>
                              <button
                                className="share-dropdown-publish-btn"
                                onClick={() => publicUrl && window.open(publicUrl, '_blank')}
                              >
                                Ver sitio
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="share-dropdown-publish-desc">
                              Publica esta nota para que cualquiera con el enlace pueda verla.
                            </p>
                            <button
                              className="share-dropdown-publish-btn"
                              onClick={handlePublish}
                            >
                              Publicar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </span>
          )}
          <button
            className={`editor-star-btn ${isFavorite ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </button>
        </div>
      </header>

      {isPublic && publicUrl && (
        <div className="publish-banner">
          <span className="publish-banner-text">Esta página está publicada en {publicUrl.replace(/^https?:\/\//, '')}</span>
          <button className="publish-banner-btn" onClick={() => window.open(publicUrl, '_blank')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="14" height="14">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Ver sitio web
          </button>
        </div>
      )}

      {coverUrl && (
        <div className="cover-section">
          {(userRole === 'owner' || userRole === 'editor') ? (
            <CoverPicker
              noteId={noteId}
              coverUrl={coverUrl}
              coverPosition={coverPosition}
              onCoverChange={handleCoverChange}
            />
          ) : (
            <div
              className="cover-image cover-image-full"
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundPosition: `50% ${coverPosition}%`,
              }}
            />
          )}
        </div>
      )}
      <main className={`editor-main${coverUrl ? ' has-cover' : ''}`}>
        {isLoading ? (
          <div className="editor-skeleton">
            <div className="skeleton-line w-3/4 h-6" />
            <div className="skeleton-line w-full h-4" />
            <div className="skeleton-line w-5/6 h-4" />
            <div className="skeleton-line w-4/6 h-4" />
          </div>
        ) : (
          <>
            <div className={`editor-title-area${coverUrl ? ' has-cover' : ''}${emoji ? ' has-emoji' : ''}`}>
              {userRole === 'viewer' ? (
                <>
                  {emoji && <span className="editor-emoji-display">{emoji}</span>}
                  <div className="editor-title-viewonly">{title || 'Sin título'}</div>
                </>
              ) : (
                <>
                  <div className={`editor-title-tools${coverUrl ? ' has-cover' : ''}${emoji ? ' has-emoji' : ''}`}>
                    <EmojiPicker currentEmoji={emoji} onSelect={handleEmojiSelect} />
                    {!coverUrl && !emoji && (
                      <CoverPicker
                        noteId={noteId}
                        coverUrl={coverUrl}
                        coverPosition={coverPosition}
                        onCoverChange={handleCoverChange}
                        compact
                      />
                    )}
                  </div>
                  {emoji && !coverUrl && (
                    <CoverPicker
                      noteId={noteId}
                      coverUrl={coverUrl}
                      coverPosition={coverPosition}
                      onCoverChange={handleCoverChange}
                      compact
                    />
                  )}
                  <input
                    ref={titleInputRef}
                    className="editor-title-input"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Sin título"
                  />
                </>
              )}
            </div>
            <div className="notion-editor-wrapper">
              <BlockNoteView
                editor={editor}
                editable={userRole === 'owner' || userRole === 'editor'}
                theme="light"
                className="notion-editor"
                onChange={() => { userEditedRef.current = true; }}
              />
            </div>
          </>
        )}
      </main>

      {shareModalOpen && (
        <ModalPortal>
          <ShareNoteModal
            note={{ _id: noteId, title, sharedWith: noteSharedWith }}
            onShare={handleShareNote}
            onRemoveShare={handleRemoveNoteShare}
            onChangeRole={handleChangeNoteShareRole}
            onClose={() => setShareModalOpen(false)}
          />
        </ModalPortal>
      )}
    </>
  );
};

export default NotionEditor;
