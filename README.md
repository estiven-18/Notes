# Notes 

Aplicación web completa para tomar notas, inspirada en Notion. Permite crear colecciones de notas, colaborar en tiempo real, compartir con otros usuarios y publicar notas de forma pública.

---

## Estructura del proyecto

```
notion-5/
├── frontend/                          
│   ├── src/
│   │   ├── components/               # Componentes
│   │   │   ├── NotionEditor.jsx      
│   │   │   ├── Sidebar.jsx           
│   │   │   ├── EmojiPicker.jsx       
│   │   │   ├── CoverPicker.jsx       
│   │   │   ├── SavingIndicator.jsx   
│   │   │   ├── SearchModal.jsx       
│   │   │   ├── ShareNoteModal.jsx    
│   │   │   ├── ShareCollectionModal.jsx 
│   │   │   ├── SettingsModal.jsx     
│   │   │   ├── TrashView.jsx         
│   │   │   ├── ThemeToggle.jsx       
│   │   │   ├── ConfirmModal.jsx      
│   │   │   ├── ModalPortal.jsx       
│   │   │   └── ProtectedRoute.jsx    
│   │   ├── pages/                    # vistas principales
│   │   │   ├── Library.jsx           
│   │   │   ├── CollectionView.jsx    
│   │   │   ├── PublicNote.jsx        
│   │   │   ├── Login.jsx             
│   │   │   ├── Register.jsx          
│   │   │   └── Profile.jsx           
│   │   ├── services/
│   │   │   └── api.js               # Todas las funciones de comunicación con el backend
│   │   ├── hooks/
│   │   │   └── useAutosave.js        # Hook de autoguardado con debounce
│   │   ├── store/
│   │   │   ├── store.js             # Configuración de Redux
│   │   │   ├── authSlice.js         # Estado de autenticación
│   │   │   └── ThemeContext.jsx      # Contexto del tema claro/oscuro
│   │   ├── App.jsx                   
│   │   ├── main.jsx                  
│   │   └── index.css                 
│   ├── index.html                    
│   ├── vite.config.js              
│   ├── tailwind.config.js           
│   └── postcss.config.js            
│
├── backend/                          
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Conexión a MongoDB con Mongoose
│   │   │   └── signaling.js         # Servidor WebSocket para colaboración
│   │   ├── controllers/             # Lógica de negocio (qué hacer con cada petición)
│   │   │   ├── authController.js    
│   │   │   ├── documentController.js 
│   │   │   ├── collectionController.js 
│   │   │   ├── notificationController.js 
│   │   │   └── uploadController.js  # Subida de archivos (imágenes)
│   │   ├── models/                  # Modelos de datos (estructura en MongoDB)
│   │   │   ├── User.js             
│   │   │   ├── Document.js         
│   │   │   ├── Collection.js       
│   │   │   └── Notification.js     
│   │   ├── routes/                  # Definición de endpoints ( URLs de la API)
│   │   │   ├── authRoutes.js       
│   │   │   ├── documentRoutes.js   
│   │   │   ├── collectionRoutes.js 
│   │   │   ├── notificationRoutes.js 
│   │   │   └── uploadRoutes.js     
│   │   ├── middleware/
│   │   │   └── auth.js             # Middleware de autenticación JWT
│   │   └── utils/
│   │       ├── migrateSharedWith.js # Migración de datos antiguos
│   │       └── trashCleanup.js      # Limpieza automática de papelera (cron)
│   ├── uploads/                     
│   ├── .env                         
│   └── package.json
│
└── README.md
```

---

## Modelos de Datos

### User (Usuario)

```javascript
{
  name: String,        // Nombre del usuario
  email: String,       // Email único
  password: String,    // Contraseña hasheada (bcrypt)
  createdAt: Date      // Fecha de creación
}
```

### Document (Nota)

```javascript
{
  user: ObjectId,           // Referencia al propietario
  title: String,            // Título de la nota
  content: Mixed,           // Contenido del editor (JSON de BlockNote)
  collectionId: ObjectId,   // Colección a la que pertenece
  emoji: String,            // Emoji representativo
  coverUrl: String,         // URL de imagen de portada
  coverPosition: Number,    // Posición de la portada (0-100)
  sharedWith: [{            // Usuarios con acceso
    user: ObjectId,
    role: String            // "editor" o "viewer"
  }],
  isDeleted: Boolean,       // Está en papelera
  deletedAt: Date,          // Cuándo se eliminó
  isPublic: Boolean,        // Es pública
  publicId: String,         // ID único para URL pública
  metadata: {
    isFavorite: Boolean,    // Es favorita
    tags: [String]          // Etiquetas
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection (Colección)

```javascript
{
  user: ObjectId,           // Propietario
  name: String,             // Nombre
  emoji: String,            // Emoji
  isFavorite: Boolean,      // Es favorita
  isPublic: Boolean,        // Es pública
  sharedWith: [{            // Compartida con
    user: ObjectId,
    role: String
  }],
  isDeleted: Boolean,       // En papelera
  hiddenFromRecents: Boolean, // Ocultada de recientes
  createdAt: Date,
  updatedAt: Date,
  visitedAt: Date           // Última visita
}
```

### Notification (Notificación)

```javascript
{
  type: String,      // "share_invitation" o "invitation_accepted"
  from: ObjectId,    // Quién envió
  to: ObjectId,      // A quién va dirigida
  collection: ObjectId, // Colección relacionada
  role: String,      // "editor" o "viewer"
  status: String,    // "pending", "accepted", "rejected"
  read: Boolean,     // Fue leída
  createdAt: Date
}
```

---


## Tecnologías Resumidas

| Capa | Tecnología | Para qué |
|---|---|---|
| Frontend | React 19 | Interfaz de usuario |
| Build | Vite 8 | Servidor de desarrollo y construcción |
| Routing | React Router v7 | Navegación entre páginas |
| Estado | Redux Toolkit | Estado global (usuario, tema) |
| Editor | BlockNote | Editor de texto rico estilo Notion |
| Colaboración | Yjs + WebSocket | Edición en tiempo real |
| Estilos | Tailwind CSS 4 + CSS custom | Diseño visual |
| Backend | Express 4 + Node.js | Servidor API |
| Base de datos | MongoDB + Mongoose | Almacenamiento de datos |
| Auth | JWT + bcryptjs | Autenticación segura |
| Archivos | Multer | Subida de imágenes |
| Tareas | node-cron | Limpieza automática de papelera |

---
