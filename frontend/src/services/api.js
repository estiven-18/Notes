const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export const getDocument = async () => {
  const response = await fetch(`${API_URL}/document`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const saveDocument = async ({ content, title }) => {
  const response = await fetch(`${API_URL}/document`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, title }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getCollections = async () => {
  const response = await fetch(`${API_URL}/collections`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const createCollection = async (name) => {
  const response = await fetch(`${API_URL}/collections`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const renameCollection = async (id, name) => {
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteCollection = async (id) => {
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getNotesByCollection = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/notes`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const createNote = async (collectionId, title, emoji = null) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, emoji }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getNoteById = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateNoteById = async (noteId, { content, title, emoji, favorite }) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, title, emoji, favorite }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const deleteNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getFavorites = async () => {
  const response = await fetch(`${API_URL}/document/favorites/all`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleFavorite = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/favorite`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getFavoriteCollections = async () => {
  const response = await fetch(`${API_URL}/collections/favorites`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const register = async (name, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const verifyAuth = async () => {
  const response = await fetch(`${API_URL}/auth/verify`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateProfile = async ({ name, email, password, currentPassword }) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email }),
  });
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
