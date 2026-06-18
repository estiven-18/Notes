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

const NotionEditor = ({ noteId, onTitleChange, onEmojiChange, onFavoriteToggle }) => {
  const currentUser = useSelector((state) => state.auth.user);

  if (!noteId) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-text">
          Selecciona una nota de la barra lateral o crea una nueva
        </div>
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
      />
    </div>
  );
};

const EditorInner = ({ noteId, currentUser, onTitleChange, onEmojiChange, onFavoriteToggle }) => {
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
  const [showPublicUrl, setShowPublicUrl] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverPosition, setCoverPosition] = useState(0);
  const titleTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const titleInputRef = useRef(null);
  const loadedContentRef = useRef(null);

  const WS_URL = import.meta.env.VITE_WS_URL || `http://localhost:3001`;

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
    if (!editor || isSavingRef.current) return;
    const doc = editor.document;
    const contentStr = JSON.stringify(doc);
    if (contentStr === loadedContentRef.current) return;
    isSavingRef.current = true;
    try {
      await updateNoteById(noteId, { content: doc });
      loadedContentRef.current = contentStr;
      setLastSaved(Date.now());
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
  }, [noteId, editor]);

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
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
          setNoteSharedWith(note.sharedWith || []);
          setUserRole(role);
          setLastSaved(new Date(note.updatedAt).getTime());
        });
        if (note.content && note.content.length > 0) {
          editor.replaceBlocks(editor.document, note.content);
        } else {
          editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
        }
        loadedContentRef.current = JSON.stringify(editor.document);
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

  useEffect(() => {
    if (!showPublicUrl) return;
    const handler = (e) => {
      if (!e.target.closest('.public-url-popover') && !e.target.closest('.editor-star-btn.published')) {
        setShowPublicUrl(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPublicUrl]);

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
        setLastSaved(Date.now());
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
    setLastSaved(Date.now());
  };

  const handleEmojiSelect = async (newEmoji) => {
    setEmoji(newEmoji);
    if (onEmojiChange) onEmojiChange(noteId, newEmoji);
    try {
      await updateNoteById(noteId, { emoji: newEmoji });
      setLastSaved(Date.now());
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
  };

  const handleRemoveNoteShare = async (nid, userId) => {
    const updated = await removeNoteShare(nid, userId);
    setNoteSharedWith(updated.sharedWith || []);
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
      setShowPublicUrl(true);
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
        <p>Error al cargar la nota</p>
        <p className="editor-error-sub">{error}</p>
      </div>
    );
  }

  return (
    <>
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button
            className={`editor-star-btn ${isFavorite ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          </button>
          {userRole !== 'viewer' && (
            <button
              className="editor-star-btn"
              onClick={() => setShareModalOpen(true)}
              title="Compartir nota"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
            </button>
          )}
          {userRole === 'owner' && (
            <>
              <span className="editor-publish-btn-wrapper">
                <button
                  className={`editor-star-btn ${isPublic ? "published" : ""}`}
                  onClick={isPublic ? handleUnpublish : handlePublish}
                  title={isPublic ? "Despublicar nota" : "Publicar nota"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isPublic ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.006c0 1.113.285 2.16.786 3.07M15 19.128v-.003" />
                  </svg>
                </button>
              </span>
              {showPublicUrl && publicUrl && (
                <div className="public-url-popover">
                  <div className="public-url-popover-header">
                    <span>Enlace público</span>
                    <button className="public-url-close" onClick={() => setShowPublicUrl(false)}>&times;</button>
                  </div>
                  <div className="public-url-popover-body">
                    <input
                      className="public-url-input"
                      type="text"
                      value={publicUrl}
                      readOnly
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      className="public-url-copy"
                      onClick={(e) => {
                        navigator.clipboard.writeText(publicUrl);
                        e.target.textContent = '¡Copiado!';
                        setTimeout(() => {
                          e.target.textContent = 'Copiar';
                        }, 2000);
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <span className="editor-topbar-brand">{emoji ? `${emoji} ` : ''}{title || 'Sin título'}</span>
        </div>
        <SavingIndicator lastSaved={lastSaved} />
      </header>

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
                    {!coverUrl && (
                      <CoverPicker
                        noteId={noteId}
                        coverUrl={coverUrl}
                        coverPosition={coverPosition}
                        onCoverChange={handleCoverChange}
                        compact
                      />
                    )}
                  </div>
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
