# Prolog Tutor

Un entorno educativo interactivo diseñado para visualizar el proceso de inferencia lógica de Prolog. A diferencia de otros intérpretes, **Prolog Tutor** extrae el árbol de derivación completo, permitiendo a los estudiantes entender el **Backtracking** y la **Unificación** paso a paso de manera visual.

## Arquitectura del Sistema

El proyecto utiliza una arquitectura de integración de sistemas (Sistemas Embebidos/Orquestación) entre un servidor web moderno y un motor de inferencia de grado industrial:

* **Frontend:** React.js con visualización dinámica de árboles mediante estructuras jerárquicas.
* **Backend:** Node.js (Express) encargado de la orquestación de subprocesos y parsing de trazas.
* **Motor Lógico:** SWI-Prolog ejecutado como subproceso nativo en Ubuntu para garantizar la fidelidad del estándar ISO de Prolog.

---

## 🚀 Instalación y Uso

Este proyecto consta de dos partes: una API en el backend (Node.js) que se comunica con SWI-Prolog, y un frontend interactivo (React) para visualizar el árbol.

### Método 1: Docker (Recomendado)
La forma más fácil de ejecutar Prolog Tutor es usando Docker:

#### En Fedora:
```bash
# Si no tienes Docker instalado, primero instálalo:
./install-fedora.sh

# Luego cierra sesión y vuelve a entrar para aplicar cambios
```

#### En cualquier sistema:
```bash
# Clonar el repositorio (si no lo tienes)
git clone <repositorio>
cd Prolog-Tutor

# Dar permisos de ejecución al script
chmod +x docker-start.sh

# Iniciar la aplicación
./docker-start.sh up
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

Para más comandos y opciones, consulta [DOCKER-README.md](DOCKER-README.md).

### Método 2: Instalación Manual
#### Requisitos Previos
1. [Node.js](https://nodejs.org/) instalado en tu sistema.
2. [SWI-Prolog](https://www.swi-prolog.org/) instalado y agregado a las variables de entorno (`PATH`) de tu sistema para que el comando `swipl` funcione en la terminal.

#### 1. Levantar el Backend
Abre una terminal, navega a la carpeta del backend y ejecuta:
```bash
cd Backend
npm install   # Instala Express, CORS, etc. automáticamente
node app.js   # Inicia el servidor en el puerto 3000
```

#### 2. Levantar el Frontend
Abre una **nueva** terminal, navega a la carpeta de React y ejecuta:
```bash
cd Frontend
npm install   # Instala react-d3-tree y demás dependencias automáticamente
npm start     # Inicia la aplicación web
```

¡Listo! Abre tu navegador y comienza a generar árboles deductivos.

---

## 🐳 Dockerización

El proyecto está completamente dockerizado para facilitar el despliegue:

### Estructura Docker:
```
Prolog-Tutor/
├── Backend/Dockerfile          # Node.js + SWI-Prolog
├── Frontend/Dockerfile         # React + Nginx
├── docker-compose.yml          # Orquestación
├── docker-start.sh             # Script de gestión
└── DOCKER-README.md            # Documentación Docker
```

### Características Docker:
- **Multi-stage builds** para optimización de imágenes
- **Health checks** automáticos para monitoreo
- **Volúmenes persistentes** para archivos Prolog
- **Red interna** para comunicación segura entre servicios
- **Modo desarrollo** con hot-reload para desarrollo

### Comandos principales:
```bash
# Iniciar en producción
./docker-start.sh up

# Iniciar en desarrollo
./docker-start.sh up-dev

# Ver estado
./docker-start.sh status

# Ver logs
./docker-start.sh logs

# Detener
./docker-start.sh down
```

Para documentación completa de Docker, consulta [DOCKER-README.md](DOCKER-README.md).
