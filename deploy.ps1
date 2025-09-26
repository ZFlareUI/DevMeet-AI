# DevMeet AI Production Deployment Script for Windows
# This script automates the deployment process for production environments on Windows

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "backup", "build", "migrate", "cleanup", "status", "logs", "stop", "restart")]
    [string]$Command = "deploy",
    
    [Parameter(Position=1)]
    [string]$Service = "app"
)

# Configuration
$AppName = "devmeet-ai"
$DockerImage = "$AppName:latest"
$ContainerName = "$AppName-app"
$NetworkName = "$AppName-network"
$EnvFile = ".env.production"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed
    try {
        $null = docker --version
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    # Check if Docker Compose is installed
    try {
        $null = docker-compose --version
    }
    catch {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    # Check if environment file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Warning "Environment file $EnvFile not found. Creating from template..."
        Copy-Item ".env.example" $EnvFile
        Write-Warning "Please update $EnvFile with your production values before continuing."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

function Backup-Database {
    Write-Info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    if (-not (Test-Path "./backups")) {
        New-Item -ItemType Directory -Path "./backups" | Out-Null
    }
    
    # Get current timestamp
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = "./backups/backup_$Timestamp.sql"
    
    # Create database backup
    try {
        docker-compose exec -T postgres pg_dump -U devmeet devmeet_ai | Out-File -FilePath $BackupFile -Encoding UTF8
        Write-Success "Database backup created: $BackupFile"
    }
    catch {
        Write-Warning "Database backup failed (this is normal for first deployment)"
    }
}

function Start-ApplicationBuild {
    Write-Info "Building application..."
    
    # Stop existing containers
    docker-compose down
    
    # Build the application using configured image name
    docker-compose build --no-cache
    docker image tag "${AppName}_app" $DockerImage
    
    Write-Success "Application built successfully with image: $DockerImage"
}

function Invoke-DatabaseMigrations {
    Write-Info "Running database migrations..."
    
    # Start database services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    Write-Info "Waiting for database to be ready..."
    Start-Sleep -Seconds 10
    
    # Run Prisma migrations
    docker-compose run --rm app npx prisma migrate deploy
    
    # Generate Prisma client
    docker-compose run --rm app npx prisma generate
    
    Write-Success "Database migrations completed"
}

function Start-ApplicationDeployment {
    Write-Info "Deploying application..."
    
    # Create network if it doesn't exist
    try {
        docker network create $NetworkName
        Write-Info "Created network: $NetworkName"
    }
    catch {
        Write-Info "Network $NetworkName already exists"
    }
    
    # Start all services with named container
    docker-compose --env-file $EnvFile up -d
    docker rename "${AppName}_app_1" $ContainerName -ErrorAction SilentlyContinue
    
    Write-Success "Application deployed successfully as container: $ContainerName"
}

function Test-ApplicationHealth {
    # Wait for application to be ready
    Write-Info "Waiting for application to start..."
    Start-Sleep -Seconds 30
    
    # Check if application is healthy
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Application is running and healthy"
        }
        else {
            throw "Health check returned status code: $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Application health check failed: $_"
        docker-compose logs app
        exit 1
    }
}

function Remove-OldResources {
    Write-Info "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep only last 5)
    if (Test-Path "./backups") {
        Get-ChildItem "./backups" -Filter "backup_*.sql" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -Skip 5 | 
            Remove-Item -Force
    }
    
    Write-Success "Cleanup completed"
}

function Show-Status {
    Write-Info "Deployment Status:"
    Write-Host "===================="
    docker-compose ps
    Write-Host ""
    
    Write-Info "Application URLs:"
    Write-Host "- Application: http://localhost:3000"
    Write-Host "- Health Check: http://localhost:3000/api/health"
    Write-Host ""
    
    Write-Info "To view logs:"
    Write-Host "- Application logs: docker-compose logs -f app"
    Write-Host "- Database logs: docker-compose logs -f postgres"
    Write-Host "- All logs: docker-compose logs -f"
    Write-Host ""
    
    Write-Info "To stop the application:"
    Write-Host "- docker-compose down"
}

function Start-Deployment {
    Write-Info "Starting DevMeet AI Production Deployment"
    Write-Host "=========================================="
    
    Test-Prerequisites
    Backup-Database
    Start-ApplicationBuild
    Invoke-DatabaseMigrations
    Start-ApplicationDeployment
    Remove-OldResources
    
    Write-Success "Deployment completed successfully!"
    Show-Status
}

# Main script logic
switch ($Command) {
    "deploy" {
        Start-Deployment
    }
    "backup" {
        Backup-Database
    }
    "build" {
        Start-ApplicationBuild
    }
    "migrate" {
        Invoke-DatabaseMigrations
    }
    "cleanup" {
        Remove-OldResources
    }
    "status" {
        Show-Status
    }
    "logs" {
        docker-compose logs -f $Service
    }
    "stop" {
        Write-Info "Stopping application..."
        docker-compose down
        Write-Success "Application stopped"
    }
    "restart" {
        Write-Info "Restarting application..."
        docker-compose restart $Service
        Write-Success "Application restarted"
    }
}

# Help message
if ($Command -eq "help" -or $args -contains "--help" -or $args -contains "-h") {
    Write-Host "DevMeet AI Deployment Script"
    Write-Host "Usage: .\deploy.ps1 [command] [service]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  deploy   - Full deployment process (default)"
    Write-Host "  backup   - Create database backup"
    Write-Host "  build    - Build application"
    Write-Host "  migrate  - Run database migrations"
    Write-Host "  cleanup  - Clean up old resources"
    Write-Host "  status   - Show deployment status"
    Write-Host "  logs     - Show application logs"
    Write-Host "  stop     - Stop the application"
    Write-Host "  restart  - Restart the application"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 deploy"
    Write-Host "  .\deploy.ps1 logs app"
    Write-Host "  .\deploy.ps1 restart postgres"
}