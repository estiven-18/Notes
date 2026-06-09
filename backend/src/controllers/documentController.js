import Document from '../models/Document.js';

/**
 * Controlador de Documentos
 * 
 * Maneja las operaciones CRUD básicas para el documento único de prueba.
 * En el futuro se extenderá para manejar múltiples documentos por workspace/usuario.
 */

/**
 * Obtiene el documento de prueba (crea uno si no existe)
 * GET /api/document
 */
export const getDocument = async (req, res) => {
  try {
    // Buscar el primer documento o crear uno por defecto
    let document = await Document.findOne().sort({ createdAt: 1 });
    
    if (!document) {
      // Crear documento inicial con contenido vacío de BlockNote
      document = await Document.create({
        title: 'Mi Primer Documento',
        content: [
          {
            type: 'paragraph',
            content: [],
            id: 'block-' + Date.now()
          }
        ]
      });
      console.log('Documento inicial creado');
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el documento',
      error: error.message
    });
  }
};

/**
 * Actualiza el contenido del documento
 * PUT /api/document
 * 
 * Espera en el body:
 * - content: array de bloques BlockNote
 * - title: string (opcional)
 */
export const updateDocument = async (req, res) => {
  try {
    const { content, title } = req.body;

    // Validación básica
    if (!content || !Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: 'El contenido es requerido y debe ser un array'
      });
    }

    // Buscar y actualizar el documento
    const document = await Document.findOneAndUpdate(
      {}, // Buscar el primer documento
      { 
        content,
        ...(title && { title })
      },
      { 
        new: true, // Retornar documento actualizado
        runValidators: true,
        upsert: true // Crear si no existe
      }
    );

    res.json({
      success: true,
      data: document,
      message: 'Documento guardado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar el documento',
      error: error.message
    });
  }
};

/**
 * Crea un nuevo documento (para uso futuro)
 * POST /api/document
 */
export const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;

    const document = await Document.create({
      title: title || 'Nuevo Documento',
      content: content || [{ type: 'paragraph', content: [], id: 'block-' + Date.now() }]
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el documento',
      error: error.message
    });
  }
};

/**
 * Elimina un documento (para uso futuro)
 * DELETE /api/document/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findByIdAndDelete(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Documento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el documento',
      error: error.message
    });
  }
};