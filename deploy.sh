#!/bin/bash

# DevMeet AI Production Deployment Script
# This script automates the deployment process for production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="devmeet-ai"
DOCKER_IMAGE="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME-app"
NETWORK_NAME="$APP_NAME-network"
ENV_FILE=".env.production"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file $ENV_FILE not found. Creating from template..."
        cp .env.example "$ENV_FILE"
        log_warning "Please update $ENV_FILE with your production values before continuing."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

backup_database() {
    log_info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p ./backups
    
    # Get current timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="./backups/backup_$TIMESTAMP.sql"
    
    # Create database backup
    if docker-compose exec -T postgres pg_dump -U devmeet devmeet_ai > "$BACKUP_FILE"; then
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "Database backup failed (this is normal for first deployment)"
    fi
}

build_application() {
    log_info "Building application..."
    
    # Stop existing containers
    docker-compose down
    
    # Build the application
    docker-compose build --no-cache
    
    log_success "Application built successfully"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Start database services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run Prisma migrations
    docker-compose run --rm app npx prisma migrate deploy
    
    # Generate Prisma client
    docker-compose run --rm app npx prisma generate
    
    log_success "Database migrations completed"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Start all services
    docker-compose --env-file "$ENV_FILE" up -d
    
    # Wait for application to be ready
    log_info "Waiting for application to start..."
    sleep 30
    
    # Check if application is healthy
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application is running and healthy"
    else
        log_error "Application health check failed"
        docker-compose logs app
        exit 1
    fi
}

cleanup_old_resources() {
    log_info "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep only last 5)
    if [ -d "./backups" ]; then
        find ./backups -name "backup_*.sql" | head -n -5 | xargs rm -f
    fi
    
    log_success "Cleanup completed"
}

show_status() {
    log_info "Deployment Status:"
    echo "===================="
    docker-compose ps
    echo ""
    
    log_info "Application URLs:"
    echo "- Application: http://localhost:3000"
    echo "- Health Check: http://localhost:3000/api/health"
    echo ""
    
    log_info "To view logs:"
    echo "- Application logs: docker-compose logs -f app"
    echo "- Database logs: docker-compose logs -f postgres"
    echo "- All logs: docker-compose logs -f"
    echo ""
    
    log_info "To stop the application:"
    echo "- docker-compose down"
}

# Main deployment process
main() {
    log_info "Starting DevMeet AI Production Deployment"
    echo "=========================================="
    
    check_prerequisites
    backup_database
    build_application
    run_database_migrations
    deploy_application
    cleanup_old_resources
    
    log_success "Deployment completed successfully!"
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        backup_database
        ;;
    "build")
        build_application
        ;;
    "migrate")
        run_database_migrations
        ;;
    "cleanup")
        cleanup_old_resources
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose logs -f "${2:-app}"
        ;;
    "stop")
        log_info "Stopping application..."
        docker-compose down
        log_success "Application stopped"
        ;;
    "restart")
        log_info "Restarting application..."
        docker-compose restart "${2:-app}"
        log_success "Application restarted"
        ;;
    *)
        echo "Usage: $0 {deploy|backup|build|migrate|cleanup|status|logs|stop|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment process (default)"
        echo "  backup   - Create database backup"
        echo "  build    - Build application"
        echo "  migrate  - Run database migrations"
        echo "  cleanup  - Clean up old resources"
        echo "  status   - Show deployment status"
        echo "  logs     - Show application logs"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        exit 1
        ;;
esac