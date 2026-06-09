import { useEffect, useState, useCallback } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { getDocument, saveDocument } from '../services/api';
import useAutosave from '../hooks/useAutosave';
import SavingIndicator from './SavingIndicator';

const NotionEditor = () => {
  const [documentId, setDocumentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Crear editor BlockNote
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: 'paragraph',
        content: 'Cargando documento...',
      },
    ],
  });

  // Cargar documento al iniciar
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await getDocument();
        setDocumentId(doc._id);

        // Cargar contenido en el editor si existe
        if (doc.content && doc.content.length > 0) {
          editor.replaceBlocks(editor.document, doc.content);
        } else {
          // Contenido inicial vacío
          editor.replaceBlocks(editor.document, [
            {
              type: 'paragraph',
              content: [],
            },
          ]);
        }

        document.title = doc.title || 'Notion Clone - Editor';
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (editor) {
      loadDocument();
    }
  }, [editor]);

  // Función de guardado
  const handleSave = useCallback(async () => {
    if (!editor || !documentId) return;

    try {
      setIsSaving(true);
      const content = editor.document;
      await saveDocument({ content });
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  }, [editor, documentId]);

  // Autosave con debounce de 2 segundos
  useAutosave(handleSave, [editor?.document], 2000);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <div className="text-center">
          <p className="text-lg mb-2">Error al cargar el documento</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Barra superior con información de guardado */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-2">
              {/* Placeholder para futuros controles */}
              <span className="text-sm text-gray-400 font-medium">Notes</span>
            </div>
            <SavingIndicator isSaving={isSaving} lastSaved={lastSaved} />
          </div>
        </div>
      </header>

      {/* Contenido del editor */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        ) : (
          <div className="notion-editor-wrapper">
            <BlockNoteView
              editor={editor}
              theme="light"
              data-blocknote-version
              className="notion-editor"
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default NotionEditor;