const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const getDocument = async () => {
  const response = await fetch(`${API_URL}/document`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const saveDocument = async ({ content, title }) => {
  const response = await fetch(`${API_URL}/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getCollections = async () => {
  const response = await fetch(`${API_URL}/collections`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const createCollection = async (name) => {
  const response = await fetch(`${API_URL}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const renameCollection = async (id, name) => {
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteCollection = async (id) => {
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getNotesByCollection = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/notes`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const createNote = async (collectionId, title, emoji = null) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, emoji }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getNoteById = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateNoteById = async (noteId, { content, title, emoji, favorite }) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title, emoji, favorite }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getFavorites = async () => {
  const response = await fetch(`${API_URL}/document/favorites/all`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleFavorite = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/favorite`, {
    method: "POST",
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getFavoriteCollections = async () => {
  const response = await fetch(`${API_URL}/collections/favorites`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleCollectionFavorite = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/favorite`, {
    method: "POST",
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};
