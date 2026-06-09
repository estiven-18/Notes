# Notes

Aplicación web minimalista inspirada en Notion, construida con **React + BlockNote + Express + MongoDB**.

## Stack Tecnológico

| Capa       | Tecnología                  |
|------------|-----------------------------|
| Frontend   | React, JavaScript, Vite     |
| Estilos    | Tailwind CSS                |
| Editor     | BlockNote                   |
| Backend    | Node.js, Express            |
| Base Datos | MongoDB, Mongoose            |

## Estructura del Proyecto

```
notion-5/
├── frontend/                    # Cliente React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotionEditor.jsx    # Editor principal con BlockNote
│   │   │   └── SavingIndicator.jsx # Indicador de guardado (esquina superior)
│   │   ├── hooks/
│   │   │   └── useAutosave.js      # Hook de autoguardado con debounce
│   │   ├── services/
│   │   │   └── api.js              # Comunicación con el backend
│   │   ├── App.jsx                 # Componente raíz
│   │   ├── main.jsx                # Punto de entrada
│   │   └── index.css               # Estilos globales + Tailwind
│   ├── index.html
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                     # Servidor Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # Conexión a MongoDB
│   │   ├── controllers/
│   │   │   └── documentController.js  # Lógica CRUD
│   │   ├── models/
│   │   │   └── Document.js         # Schema Mongoose del documento
│   │   ├── routes/
│   │   │   └── documentRoutes.js   # Definición de rutas
│   │   └── index.js                # Entry point del servidor
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Flujo de la Aplicación

```
1. Abrir app → Frontend pide documento al backend (GET /api/document)
2. Backend busca en MongoDB → Si no existe, crea uno vacío
3. Backend devuelve el documento → Frontend carga contenido en BlockNote
4. Usuario edita con BlockNote → Después de 2s sin escribir, autosave
5. Autosave → PUT /api/document con el contenido actualizado
6. Al recargar → Se repite el ciclo, el contenido persiste
```

## Cómo Ejecutar Localmente

### Requisitos

- Node.js >= 18
- MongoDB corriendo localmente (o Atlas URI)

### 1. Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env si es necesario (MONGODB_URI, PORT)

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev     # Con --watch (recarga automática)
# o
npm start       # Sin recarga
```

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev     # http://localhost:5173
```

### 3. ABRIR

```
http://localhost:5173
```

## API Endpoints

| Método | Ruta             | Descripción                            |
|--------|------------------|----------------------------------------|
| GET    | /api/document    | Obtiene el documento (crea uno si no) |
| PUT    | /api/document    | Actualiza el contenido del documento   |
| POST   | /api/document    | Crea un nuevo documento (futuro)       |
| DELETE | /api/document/:id| Elimina un documento (futuro)          |
| GET    | /api/health      | Health check                           |

## Autosave

- **Debounce:** 2 segundos después de que el usuario deja de escribir
- **Indicador visual:** Muestra "Guardando..." con animación y "Guardado HH:MM:SS"
- **Frecuencia:** Solo guarda cuando hay cambios, no en cada tecla

## Diseño - Inspirado en Notion

- **Escala de grises** minimalista
- **Editor a pantalla completa** con ancho máximo tipo Notion
- **Barra superior** sutil con indicador de guardado
- **Scrollbar** personalizada
- **Tipografía** Inter (BlockNote) con fallback sistema

## Extensibilidad Futura

El modelo `Document` incluye `metadata` preparado para:

```js
metadata: {
  workspaceId:  // Para workspaces
  parentId:     // Para páginas anidadas
  createdBy:    // Para usuarios
  isFavorite:   // Para favoritos
  tags: []       // Para búsqueda
}
```

Próximas funcionalidades planeadas:

- Workspaces
- Páginas (documentos anidados)
- Favoritos
- Búsqueda
- Autenticación de usuarios
