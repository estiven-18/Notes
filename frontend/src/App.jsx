import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NotionEditor from './components/NotionEditor';
import { getNoteById } from './services/api';

function App() {
  const [activeNote, setActiveNote] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeNote'));
    } catch {
      return null;
    }
  });
  const [favoriteRefreshKey, setFavoriteRefreshKey] = useState(0);

  useEffect(() => {
    if (activeNote) {
      localStorage.setItem('activeNote', JSON.stringify(activeNote));
      const emoji = activeNote.emoji && activeNote.emoji !== null ? activeNote.emoji + ' ' : '';
      const title = activeNote.title || 'Sin título';
      document.title = `${emoji}${title} | Notes`;
    } else {
      localStorage.removeItem('activeNote');
      document.title = 'Notes';
    }
  }, [activeNote]);

  useEffect(() => {
    if (activeNote?._id) {
      getNoteById(activeNote._id).then((note) => {
        setActiveNote((prev) =>
          prev && prev._id === note._id
            ? {
                ...prev,
                title: note.title || 'Sin título',
                emoji: note.emoji ?? prev.emoji,
                updatedAt: note.updatedAt,
              }
            : prev,
        );
      }).catch(() => {});
    }
  }, []);

  const handleSelectNote = useCallback((note) => {
    setActiveNote(note);
  }, []);

  const handleTitleChange = useCallback((noteId, newTitle) => {
    setActiveNote((prev) => prev && prev._id === noteId ? { ...prev, title: newTitle } : prev);
  }, []);

  const handleEmojiChange = useCallback((noteId, newEmoji) => {
    setActiveNote((prev) => prev && prev._id === noteId ? { ...prev, emoji: newEmoji } : prev);
  }, []);

  const handleFavoriteToggle = useCallback(() => {
    setFavoriteRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar
        activeNote={activeNote}
        onSelectNote={handleSelectNote}
        favoriteRefreshKey={favoriteRefreshKey}
      />
      <NotionEditor
        noteId={activeNote?._id}
        onTitleChange={handleTitleChange}
        onEmojiChange={handleEmojiChange}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </div>
  );
}

export default App;