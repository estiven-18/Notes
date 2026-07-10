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

export const getCollection = async (id) => {
  const response = await fetch(`${API_URL}/collections/${id}`, {
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

export const renameCollection = async (id, name, emoji) => {
  const body = { name };
  if (emoji !== undefined) body.emoji = emoji;
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const publishCollection = async (id) => {
  const response = await fetch(`${API_URL}/collections/${id}/publish`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const unpublishCollection = async (id) => {
  const response = await fetch(`${API_URL}/collections/${id}/unpublish`, {
    method: "POST",
    headers: getAuthHeaders(),
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

export const restoreNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/restore`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const permanentDeleteNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/permanent`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const restoreCollection = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/restore`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const permanentDeleteCollection = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/permanent`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getTrashItems = async () => {
  const response = await fetch(`${API_URL}/document/trash`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const publishNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/publish`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const unpublishNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/unpublish`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getPublicNote = async (publicId) => {
  const response = await fetch(`${API_URL}/document/public/${publicId}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
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

export const updateProfile = async ({ name, email, password }) => {
  const body = { name, email };
  if (password) body.password = password;
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const shareCollection = async (collectionId, email, role = 'editor') => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/share`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, role }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const removeShare = async (collectionId, userId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/unshare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getSharedCollections = async () => {
  const response = await fetch(`${API_URL}/collections/shared/with-me`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const searchNotes = async (q) => {
  const response = await fetch(`${API_URL}/collections/search?q=${encodeURIComponent(q)}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleCollectionFavorite = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/favorite`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleHideFromRecents = async (collectionId) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/hide-recents`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const shareNote = async (noteId, email, role = 'editor') => {
  const response = await fetch(`${API_URL}/document/${noteId}/share`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, role }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const removeNoteShare = async (noteId, userId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/unshare`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const leaveSharedNote = async (noteId) => {
  const response = await fetch(`${API_URL}/document/${noteId}/leave`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const changeShareRole = async (collectionId, userId, role) => {
  const response = await fetch(`${API_URL}/collections/${collectionId}/share/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const changeNoteShareRole = async (noteId, userId, role) => {
  const response = await fetch(`${API_URL}/document/${noteId}/share/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getSharedNotes = async () => {
  const response = await fetch(`${API_URL}/document/shared/with-me`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getAllNotes = async () => {
  const response = await fetch(`${API_URL}/document/all`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const getNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const acceptInvitation = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/accept`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const rejectInvitation = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateCover = async (noteId, coverUrl, coverPosition = 0) => {
  const response = await fetch(`${API_URL}/document/${noteId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ coverUrl, coverPosition }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const uploadFile = async (file) => {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data.url;
};

export const markAllNotificationsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
