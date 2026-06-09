import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import NotionEditor from "./components/NotionEditor";

function App() {
  const [activeNote, setActiveNote] = useState(null);

  const handleSelectNote = useCallback((note) => {
    setActiveNote(note);
  }, []);

  const handleTitleChange = useCallback((noteId, newTitle) => {
    setActiveNote((prev) =>
      prev && prev._id === noteId ? { ...prev, title: newTitle } : prev,
    );
  }, []);

  return (
    <div className="app-layout">
      <Sidebar activeNote={activeNote} onSelectNote={handleSelectNote} />
      <NotionEditor
        noteId={activeNote?._id}
        onTitleChange={handleTitleChange}
      />
    </div>
  );
}

export default App;
