# Guía para Subir a GitHub y Configurar MongoDB

## 1. Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `notion-clone` (o el que prefieras)
3. No marques ninguna opción (README, .gitignore, license)
4. Haz clic en **Create repository**

## 2. Subir el código

Abre la terminal en la carpeta raíz del proyecto:

```bash
# Inicializar git
git init

# Añadir todos los archivos
git add .

# Crear el primer commit
git commit -m "Initial commit: BlockNote editor with Express + MongoDB backend"

# Conectar con tu repositorio de GitHub
# (reemplaza TU_USUARIO con tu nombre de usuario)
git remote add origin https://github.com/TU_USUARIO/notion-clone.git

# Subir el código
git push -u origin main
```

Si tu rama se llama `master` en lugar de `main`:

```bash
git branch -M main
git push -u origin main
```

## 3. Configurar MongoDB

### Opción A: MongoDB Local (desarrollo rápido)

1. Descarga e instala MongoDB Community desde:
   https://www.mongodb.com/try/download/community

2. Durante la instalación, asegúrate de marcar **"Install MongoDB as a Service"**

3. MongoDB se iniciará automáticamente en:
   ```
   mongodb://localhost:27017
   ```

4. Verifica que funciona:
   ```bash
   # En Windows PowerShell
   Get-Service MongoDB
   ```
   Debería mostrar `Running`.

### Opción B: MongoDB Atlas (recomendado para producción/grupo)

1. Ve a https://www.mongodb.com/atlas
2. Regístrate o inicia sesión
3. Crea un **nuevo cluster** (el tier gratuito M0 es suficiente)
4. Configura el acceso:
   - **Database Access:** Crea un usuario con contraseña
   - **Network Access:** Añade `0.0.0.0/0` para permitir desde cualquier IP (o la IP específica de tu servidor)
5. Haz clic en **Connect → Connect your application**
6. Copia la URI de conexión, se ve así:
   ```
   mongodb+srv://<usuario>:<password>@cluster.mongodb.net/notion-clone?retryWrites=true&w=majority
   ```

### Opción C: MongoDB Docker (alternativa local)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

## 4. Configurar variables de entorno

### Backend - `backend/.env`

```env
# Puerto del servidor
PORT=3001

# URI de MongoDB
# Local:
MONGODB_URI=mongodb://localhost:27017/notion-clone
# Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/notion-clone

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend - `frontend/.env`

```env
# URL del backend
VITE_API_URL=http://localhost:3001/api
```

> **IMPORTANTE:** `frontend/.env` y `backend/.env` están en `.gitignore`, no se suben a GitHub. Cada colaborador debe crearlos localmente.

## 5. Probar que todo funciona

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 y escribe algo en el editor. Espera 2 segundos y recarga la página — el contenido debería persistir.

## 6. Compartir el proyecto

Cuando un compañero clone el repositorio:

```bash
git clone https://github.com/TU_USUARIO/notion-clone.git
cd notion-clone

# Backend
cd backend
cp .env.example .env   # Editar con su URI de MongoDB
npm install

# Frontend
cd ../frontend
npm install
```

Luego cada uno sigue el paso 5 para ejecutar.

## Solución de problemas comunes

### Error: "MongoDB no conecta"
- Verifica que MongoDB esté corriendo: `Get-Service MongoDB`
- Revisa la URI en `backend/.env`
- Prueba con: `mongodb://127.0.0.1:27017/notion-clone`

### Error: "CORS"
- Asegúrate que `backend/.env` tenga `FRONTEND_URL=http://localhost:5173`
- Verifica que el frontend esté en puerto 5173

### Error: "No se guarda el contenido"
- Abre las DevTools (F12) → Network tab
- Busca peticiones PUT a `/api/document`
- Deberían aparecer 2 segundos después de escribir

### Error de git: "failed to push some refs"
```bash
git pull origin main --rebase
git push origin main
```
