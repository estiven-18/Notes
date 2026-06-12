import { useEffect, useState, useCallback, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { getNoteById, updateNoteById, toggleFavorite } from "../services/api";
import useAutosave from "../hooks/useAutosave";
import SavingIndicator from "./SavingIndicator";
import EmojiPicker from "./EmojiPicker";

const NotionEditor = ({ noteId, onTitleChange, onEmojiChange, onFavoriteToggle }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const titleTimeoutRef = useRef(null);
  const previousNoteId = useRef(null);
  const isSavingRef = useRef(false);
  const titleInputRef = useRef(null);
  const loadedContentRef = useRef(null);

  const editor = useCreateBlockNote();

  const saveCurrentNote = useCallback(async () => {
    const id = previousNoteId.current;
    if (!editor || !id || isSavingRef.current) return;
    const contentStr = JSON.stringify(editor.document);
    if (contentStr === loadedContentRef.current) return;
    isSavingRef.current = true;
    try {
      await updateNoteById(id, { content: editor.document });
      loadedContentRef.current = contentStr;
      setLastSaved(Date.now());
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      isSavingRef.current = false;
    }
  }, [editor]);

  const loadNote = useCallback(
    async (id) => {
      if (!editor) return;
      setIsLoading(true);
      setError(null);
      try {
        const note = await getNoteById(id);
        setTitle(note.title === "Sin título" ? "" : note.title);
        setEmoji(note.emoji || null);
        setIsFavorite(note.metadata?.isFavorite || false);
        setLastSaved(new Date(note.updatedAt).getTime());
        if (note.content && note.content.length > 0) {
          editor.replaceBlocks(editor.document, note.content);
        } else {
          editor.replaceBlocks(editor.document, [
            { type: "paragraph", content: [] },
          ]);
        }
        loadedContentRef.current = JSON.stringify(editor.document);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [editor],
  );

  useEffect(() => {
    if (!noteId || !editor) return;

    if (previousNoteId.current && previousNoteId.current !== noteId) {
      saveCurrentNote().then(() => {
        previousNoteId.current = noteId;
        loadNote(noteId);
      });
    } else if (!previousNoteId.current) {
      previousNoteId.current = noteId;
      loadNote(noteId);
    }
  }, [noteId, editor, saveCurrentNote, loadNote]);

  useEffect(() => {
    if (!isLoading && (!title || title === 'Sin título') && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [noteId, isLoading, title]);

  const handleSave = useCallback(async () => {
    if (!editor || !noteId || isSavingRef.current) return;
    const contentStr = JSON.stringify(editor.document);
    if (contentStr === loadedContentRef.current) return;
    isSavingRef.current = true;
    try {
      await updateNoteById(noteId, { content: editor.document });
      loadedContentRef.current = contentStr;
      setLastSaved(Date.now());
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      isSavingRef.current = false;
    }
  }, [editor, noteId]);

  useAutosave(handleSave, [JSON.stringify(editor?.document)], 2000);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      const finalTitle = newTitle.trim() || 'Sin título';
      if (onTitleChange) onTitleChange(noteId, finalTitle);
      if (noteId) {
        try {
          await updateNoteById(noteId, { title: finalTitle });
          setTitle(finalTitle === "Sin título" ? "" : finalTitle);
          setLastSaved(Date.now());
        } catch (err) {
          console.error("Error al guardar título:", err);
        }
      }
    }, 500);
  };

  const handleEmojiSelect = async (newEmoji) => {
    setEmoji(newEmoji);
    if (onEmojiChange) onEmojiChange(noteId, newEmoji);
    if (noteId) {
      try {
        await updateNoteById(noteId, { emoji: newEmoji });
        setLastSaved(Date.now());
      } catch (err) {
        console.error("Error al guardar emoji:", err);
      }
    }
  };

  const handleFavoriteClick = async () => {
    if (!noteId) return;
    try {
      const updated = await toggleFavorite(noteId);
      const newFav = updated.metadata?.isFavorite || false;
      setIsFavorite(newFav);
      if (onFavoriteToggle) onFavoriteToggle();
    } catch (err) {
      console.error("Error al cambiar favorito:", err);
    }
  };

  if (!noteId) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-text">
          Selecciona una nota de la barra lateral o crea una nueva
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-empty">
        <p>Error al cargar la nota</p>
        <p className="editor-error-sub">{error}</p>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button
            className={`editor-star-btn ${isFavorite ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
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
    </div>
  );
};

export default NotionEditor;