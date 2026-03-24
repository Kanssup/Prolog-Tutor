# Prolog Tutor - Docker Deployment

Este documento describe cómo desplegar Prolog Tutor usando Docker y Docker Compose.

## 🐳 Requisitos Previos

### Docker y Docker Compose

#### En Fedora:
```bash
# Instalar Docker
sudo dnf install docker

# Habilitar e iniciar Docker
sudo systemctl enable --now docker

# Agregar usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar para que los cambios surtan efecto

# Instalar Docker Compose
sudo dnf install docker-compose
```

#### En otras distribuciones:
- **Docker** 20.10+ [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.0+ [Instalar Docker Compose](https://docs.docker.com/compose/install/)

#### Verificar instalación:
```bash
# Verificar Docker
docker --version

# Verificar Docker Compose (V2 integrado)
docker compose version

# O Docker Compose V1 (separado)
docker-compose --version
```

### Otros requisitos:
- **Git** (opcional, para clonar el repositorio)
- **4GB+ de RAM** recomendado para SWI-Prolog

## 📁 Estructura del Proyecto

```
Prolog-Tutor/
├── Backend/
│   ├── Dockerfile          # Configuración Docker para backend
│   ├── .dockerignore       # Archivos a ignorar en build
│   └── ...                 # Código fuente backend
├── Frontend/
│   ├── Dockerfile          # Configuración Docker para frontend
│   ├── nginx.conf          # Configuración Nginx
│   ├── .dockerignore       # Archivos a ignorar en build
│   └── ...                 # Código fuente frontend
├── docker-compose.yml      # Orquestación de servicios
├── docker-start.sh         # Script de gestión
└── DOCKER-README.md        # Esta documentación
```

## 🚀 Inicio Rápido

### 1. Clonar el repositorio (si no lo tienes)
```bash
git clone <repositorio>
cd Prolog-Tutor
```

### 2. Iniciar la aplicación
```bash
./docker-start.sh up
```

### 3. Acceder a la aplicación
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 📋 Comandos Disponibles

Usa el script `docker-start.sh` para gestionar la aplicación:

| Comando | Descripción |
|---------|-------------|
| `./docker-start.sh up` | Iniciar servicios en producción |
| `./docker-start.sh up-dev` | Iniciar servicios en modo desarrollo |
| `./docker-start.sh down` | Detener servicios |
| `./docker-start.sh build` | Construir imágenes Docker |
| `./docker-start.sh rebuild` | Reconstruir imágenes sin cache |
| `./docker-start.sh logs` | Mostrar logs en tiempo real |
| `./docker-start.sh restart` | Reiniciar servicios |
| `./docker-start.sh status` | Mostrar estado de servicios |
| `./docker-start.sh clean` | Limpiar recursos Docker no utilizados |
| `./docker-start.sh shell-backend` | Acceder a shell del backend |
| `./docker-start.sh shell-frontend` | Acceder a shell del frontend |
| `./docker-start.sh help` | Mostrar ayuda |

## 🏗️ Servicios Desplegados

### 1. **Backend** (`prolog-tutor-backend`)
- **Puerto**: 3000
- **Imagen**: Node.js 18 + SWI-Prolog
- **Health Check**: `/api/health`
- **Volumen**: `prolog_files` para persistencia de archivos Prolog

### 2. **Frontend** (`prolog-tutor-frontend`)
- **Puerto**: 80
- **Imagen**: Nginx + React build
- **Health Check**: Verifica que Nginx responda

### 3. **Red** (`prolog-network`)
- Red interna para comunicación entre servicios
- Subnet: 172.20.0.0/16

## 🔧 Configuración

### Variables de Entorno - Backend

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `NODE_ENV` | `production` | Entorno de ejecución |
| `PORT` | `3000` | Puerto del servidor |
| `PROLOG_FILES_DIR` | `/app/prolog_files` | Directorio para archivos Prolog |
| `MAX_WORKERS` | `4` | Número máximo de workers Prolog |
| `CACHE_TTL` | `300000` | TTL de cache en milisegundos |

### Variables de Entorno - Frontend

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `NODE_ENV` | `production` | Entorno de ejecución |
| `API_URL` | `http://backend:3000` | URL del backend API |

## 🛠️ Modo Desarrollo

Para desarrollo con montaje de código fuente en caliente:

```bash
./docker-start.sh up-dev
```

Esto iniciará:
- **Backend** en modo desarrollo con `npm run dev` (puerto 3000)
- **Frontend** en modo desarrollo con `npm run dev` (puerto 5173)

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:
```bash
./docker-start.sh logs
```

### Ver logs específicos:
```bash
# Logs del backend
docker-compose logs backend

# Logs del frontend
docker-compose logs frontend

# Seguir logs
docker-compose logs -f backend
```

### Estado de los servicios:
```bash
./docker-start.sh status

# O directamente
docker-compose ps
docker-compose top
```

## 🗑️ Limpieza y Mantenimiento

### Limpiar recursos no utilizados:
```bash
./docker-start.sh clean
```

### Eliminar todo y empezar desde cero:
```bash
./docker-start.sh down
docker system prune -a --volumes
./docker-start.sh build
./docker-start.sh up
```

## 🔒 Seguridad

### Recomendaciones de seguridad:
1. **No exponer puertos innecesariamente** en producción
2. **Usar variables de entorno** para credenciales
3. **Actualizar imágenes base** regularmente
4. **Escaneo de vulnerabilidades**:
   ```bash
   docker scan prolog-tutor-backend
   docker scan prolog-tutor-frontend
   ```

### Configuración de red segura:
- Los servicios se comunican a través de la red interna `prolog-network`
- Solo los puertos necesarios están expuestos al host
- Health checks verifican el estado de los servicios

## 🚨 Solución de Problemas

### Problemas específicos de Fedora

#### Problema: "Permission denied" al usar Docker sin sudo
```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a entrar
# O ejecutar:
newgrp docker
```

#### Problema: "Cannot connect to the Docker daemon"
```bash
# Verificar que el servicio Docker esté ejecutándose
sudo systemctl status docker

# Iniciar Docker si no está ejecutándose
sudo systemctl start docker

# Habilitar inicio automático
sudo systemctl enable docker
```

#### Problema: "Docker Compose no está instalado"
```bash
# Instalar Docker Compose en Fedora
sudo dnf install docker-compose

# O usar Docker Compose V2 (si tienes Docker Desktop)
# El script detectará automáticamente qué versión usar
```

### Problemas generales

#### Problema: "Port already in use"
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80
sudo lsof -i :3000

# O cambiar puertos en docker-compose.yml
```

#### Problema: "Build failed"
```bash
# Reconstruir sin cache
./docker-start.sh rebuild

# Ver logs de build
docker compose build --no-cache
```

#### Problema: "Container health check failed"
```bash
# Ver logs del contenedor
docker compose logs backend

# Verificar manualmente
curl http://localhost:3000/api/health

# Reiniciar servicio
docker compose restart backend
```

#### Problema: "Out of memory"
```bash
# Ajustar límites de memoria en docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

## 📈 Escalabilidad

### Aumentar recursos:
```yaml
# En docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Escalar horizontalmente (futuro):
```bash
# Para producción con Docker Swarm/Kubernetes
docker-compose up --scale backend=3
```

## 🐋 Comandos Docker Directos

Si prefieres no usar el script:

```bash
# Construir y ejecutar
docker-compose up -d --build

# Solo construir
docker-compose build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Ejecutar comandos dentro de contenedores
docker-compose exec backend node --version
docker-compose exec frontend nginx -t
```

## 🔮 Características Futuras

### Servicios planeados para futuras versiones:
1. **PostgreSQL** - Base de datos para persistencia
2. **Redis** - Cache distribuido
3. **Nginx Proxy** - Reverse proxy con SSL
4. **Prometheus + Grafana** - Monitoreo y métricas
5. **ELK Stack** - Centralización de logs

### Para habilitar servicios adicionales:
1. Descomentar secciones en `docker-compose.yml`
2. Configurar variables de entorno
3. Reconstruir y ejecutar

## 📝 Notas Importantes

1. **Persistencia de datos**: Los archivos Prolog se guardan en el volumen `prolog_files`
2. **Performance**: El backend usa un pool de workers Prolog para mejor rendimiento
3. **Cache**: Implementado en memoria con TTL configurable
4. **Health checks**: Ambos servicios tienen health checks automáticos
5. **Restarts**: Configurados para `unless-stopped` para alta disponibilidad

## 🤝 Contribución

Para contribuir al despliegue Docker:

1. Haz fork del repositorio
2. Crea una rama para tu feature
3. Testea los cambios con `./docker-start.sh up-dev`
4. Envía un pull request

## 📄 Licencia

Este proyecto está bajo la misma licencia que Prolog Tutor.

---

**¡Listo para usar!** 🎉 Ejecuta `./docker-start.sh up` y comienza a usar Prolog Tutor.