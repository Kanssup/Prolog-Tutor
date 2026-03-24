#!/bin/bash

# Prolog Tutor Docker Management Script
# Script para gestionar la aplicación con Docker Compose

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de ayuda
print_usage() {
    echo -e "${BLUE}Prolog Tutor - Docker Management Script${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  up           Iniciar servicios en producción"
    echo "  up-dev       Iniciar servicios en modo desarrollo"
    echo "  down         Detener y remover servicios"
    echo "  restart      Reiniciar servicios"
    echo "  rebuild      Reconstruir imágenes y reiniciar"
    echo "  logs         Ver logs de los servicios"
    echo "  status       Ver estado de los servicios"
    echo "  clean        Limpiar recursos Docker no utilizados"
    echo "  help         Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 up        # Iniciar la aplicación"
    echo "  $0 logs      # Ver logs en tiempo real"
    echo "  $0 down      # Detener la aplicación"
}

# Verificar que Docker esté instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker no está instalado.${NC}"
        echo "Por favor instala Docker antes de continuar."
        exit 1
    fi
    
    # Verificar Docker Compose (v2 integrado)
    if ! docker compose version &> /dev/null; then
        # Intentar con docker-compose v1
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}Error: Docker Compose no está instalado.${NC}"
            echo "Instala Docker Compose para continuar."
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        DOCKER_COMPOSE_CMD="docker compose"
    fi
}

# Iniciar servicios en producción
start_production() {
    echo -e "${GREEN}Iniciando Prolog Tutor en modo producción...${NC}"
    echo ""
    
    # Construir imágenes si es necesario
    echo -e "${YELLOW}Construyendo imágenes...${NC}"
    $DOCKER_COMPOSE_CMD build --no-cache
    
    echo -e "${YELLOW}Iniciando servicios...${NC}"
    $DOCKER_COMPOSE_CMD up -d
    
    echo ""
    echo -e "${GREEN}✅ Prolog Tutor está ejecutándose!${NC}"
    echo ""
    echo "Accede a la aplicación en:"
    echo -e "  ${BLUE}🌐 Frontend:${NC} http://localhost:80"
    echo -e "  ${BLUE}⚙️  Backend API:${NC} http://localhost:3000"
    echo -e "  ${BLUE}📊 Health Check:${NC} http://localhost:3000/api/health"
    echo ""
    echo "Para ver logs: $0 logs"
    echo "Para detener: $0 down"
}

# Iniciar servicios en modo desarrollo
start_development() {
    echo -e "${GREEN}Iniciando Prolog Tutor en modo desarrollo...${NC}"
    echo ""
    echo -e "${YELLOW}Modo desarrollo no implementado aún.${NC}"
    echo "Usa './start.sh' para desarrollo local."
    echo ""
    echo "O ejecuta en producción con: $0 up"
}

# Detener servicios
stop_services() {
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    $DOCKER_COMPOSE_CMD down
    
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
}

# Reiniciar servicios
restart_services() {
    echo -e "${YELLOW}Reiniciando servicios...${NC}"
    $DOCKER_COMPOSE_CMD restart
    
    echo -e "${GREEN}✅ Servicios reiniciados${NC}"
}

# Reconstruir y reiniciar
rebuild_services() {
    echo -e "${YELLOW}Reconstruyendo imágenes...${NC}"
    $DOCKER_COMPOSE_CMD build --no-cache
    
    echo -e "${YELLOW}Reiniciando servicios...${NC}"
    $DOCKER_COMPOSE_CMD up -d --force-recreate
    
    echo -e "${GREEN}✅ Servicios reconstruidos y reiniciados${NC}"
}

# Ver logs
show_logs() {
    echo -e "${YELLOW}Mostrando logs...${NC}"
    echo "Presiona Ctrl+C para salir"
    echo ""
    $DOCKER_COMPOSE_CMD logs -f
}

# Ver estado
show_status() {
    echo -e "${YELLOW}Estado de los servicios:${NC}"
    $DOCKER_COMPOSE_CMD ps
    
    echo ""
    echo -e "${YELLOW}Uso de recursos:${NC}"
    $DOCKER_COMPOSE_CMD top
}

# Limpiar recursos Docker
clean_docker() {
    echo -e "${YELLOW}Limpiando recursos Docker no utilizados...${NC}"
    
    read -p "¿Estás seguro? Esto eliminará contenedores, imágenes y volúmenes no utilizados. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a --volumes -f
        echo -e "${GREEN}✅ Limpieza completada${NC}"
    else
        echo -e "${YELLOW}Limpieza cancelada${NC}"
    fi
}

# Main script
check_docker

case "${1:-help}" in
    up)
        start_production
        ;;
    up-dev)
        start_development
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    rebuild)
        rebuild_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_docker
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo -e "${RED}Comando no reconocido: $1${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac