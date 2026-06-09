const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Obtiene el documento desde el backend
 * @returns {Promise<Object>} Documento con contenido BlockNote
 */
export const getDocument = async () => {
  const response = await fetch(`${API_URL}/document`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

/**
 * Guarda el documento en el backend
 * @param {Object} params
 * @param {Array} params.content - Bloques BlockNote
 * @param {string} [params.title] - Título opcional
 * @returns {Promise<Object>} Documento actualizado
 */
export const saveDocument = async ({ content, title }) => {
  const response = await fetch(`${API_URL}/document`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};