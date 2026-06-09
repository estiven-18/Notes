import { useEffect, useState, useCallback, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { getNoteById, updateNoteById } from "../services/api";
import useAutosave from "../hooks/useAutosave";
import SavingIndicator from "./SavingIndicator";

const NotionEditor = ({ noteId, onTitleChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [title, setTitle] = useState("");
  const titleTimeoutRef = useRef(null);
  const previousNoteId = useRef(null);
  const isSavingRef = useRef(false);
  const isLoadedRef = useRef(false);

  const editor = useCreateBlockNote();

  const saveCurrentNote = useCallback(async () => {
    const id = previousNoteId.current;
    if (!editor || !id || isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setIsSaving(true);
      const content = editor.document;
      await updateNoteById(id, { content });
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setIsSaving(false);
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
        setTitle(note.title || "Sin título");
        if (note.content && note.content.length > 0) {
          editor.replaceBlocks(editor.document, note.content);
        } else {
          editor.replaceBlocks(editor.document, [
            { type: "paragraph", content: [] },
          ]);
        }
        isLoadedRef.current = true;
      } catch (err) {
        setError(err.message);
        isLoadedRef.current = false;
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

  const handleSave = useCallback(async () => {
    if (!editor || !noteId || isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      setIsSaving(true);
      const content = editor.document;
      await updateNoteById(noteId, { content });
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [editor, noteId]);

  useAutosave(handleSave, [editor?.document], 2000);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      if (onTitleChange) onTitleChange(noteId, newTitle);
      if (noteId) {
        try {
          await updateNoteById(noteId, { title: newTitle });
        } catch (err) {
          console.error("Error al guardar título:", err);
        }
      }
    }, 500);
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
          <span className="editor-topbar-brand">Notes</span>
        </div>
        <SavingIndicator isSaving={isSaving} lastSaved={lastSaved} />
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
            <input
              className="editor-title-input"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Sin título"
            />
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
