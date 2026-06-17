import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from "react";
import { useSelector } from "react-redux";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getNoteById, updateNoteById, toggleFavorite, shareNote, removeNoteShare } from "../services/api";
import SavingIndicator from "./SavingIndicator";
import EmojiPicker from "./EmojiPicker";
import ShareNoteModal from "./ShareNoteModal";
import ModalPortal from "./ModalPortal";
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
        startTransition(() => {
          setTitle(note.title === "Sin título" ? "" : note.title);
          setEmoji(note.emoji || null);
          setIsFavorite(note.metadata?.isFavorite || false);
          setNoteSharedWith(note.sharedWith || []);
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
        setLastSaved(Date.now());
      } catch (err) {
        console.error("Error al guardar título:", err);
      }
    }, 500);
  };

  const handleEmojiSelect = async (newEmoji) => {
    setEmoji(newEmoji);
    if (onEmojiChange) onEmojiChange(noteId, newEmoji);
    try {
      await updateNoteById(noteId, { emoji: newEmoji });
      setLastSaved(Date.now());
    } catch (err) {
      console.error("Error al guardar emoji:", err);
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

  const handleShareNote = async (nid, email) => {
    const updated = await shareNote(nid, email);
    setNoteSharedWith(updated.sharedWith || []);
  };

  const handleRemoveNoteShare = async (nid, userId) => {
    const updated = await removeNoteShare(nid, userId);
    setNoteSharedWith(updated.sharedWith || []);
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
          <button
            className="editor-star-btn"
            onClick={() => setShareModalOpen(true)}
            title="Compartir nota"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </button>
          <span className="editor-topbar-brand">{emoji ? `${emoji} ` : ''}{title || 'Sin título'}</span>
        </div>
        <SavingIndicator lastSaved={lastSaved} />
      </header>

      <main className="editor-main">
        {isLoading ? (
          <div className="editor-skeleton">
            <div className="skeleton-line w-3/4 h-6" />
            <div className="skeleton-line w-full h-4" />
            <div className="skeleton-line w-5/6 h-4" />
            <div className="skeleton-line w-4/6 h-4" />
          </div>
        ) : (
          <>
            <div className="editor-title-area">
              <EmojiPicker currentEmoji={emoji} onSelect={handleEmojiSelect} />
              <input
                ref={titleInputRef}
                className="editor-title-input"
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Sin título"
              />
            </div>
            <div className="notion-editor-wrapper">
              <BlockNoteView
                editor={editor}
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
            onClose={() => setShareModalOpen(false)}
          />
        </ModalPortal>
      )}
    </>
  );
};

export default NotionEditor;
