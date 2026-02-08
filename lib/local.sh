#!/usr/bin/env bash
# Local development commands (Docker Compose)

COMPOSE_FILE="docker-compose.yml"

local_cmd() {
    case "$1" in
        up)
            check_env
            log_info "Starting all services..."
            docker compose -f $COMPOSE_FILE up -d
            log_info "Waiting for database to be ready..."
            # Wait for postgres to be healthy
            until docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U maitai > /dev/null 2>&1; do
                sleep 1
            done
            # Wait for backend to be ready
            log_info "Waiting for backend to be ready..."
            until docker compose -f $COMPOSE_FILE exec -T backend curl -sf http://localhost:8000/health > /dev/null 2>&1; do
                sleep 1
            done
            log_info "Running database migrations..."
            docker compose -f $COMPOSE_FILE exec -T backend alembic upgrade head
            log_info "Services started. Frontend: http://localhost:3000 | Backend: http://localhost:8000"
            ;;
        down)
            log_info "Stopping all services..."
            docker compose -f $COMPOSE_FILE down
            ;;
        restart)
            log_info "Restarting all services..."
            docker compose -f $COMPOSE_FILE restart
            ;;
        rebuild)
            check_env
            log_info "Rebuilding and restarting all services..."
            docker compose -f $COMPOSE_FILE down
            docker compose -f $COMPOSE_FILE build --no-cache
            docker compose -f $COMPOSE_FILE up -d
            # Wait for postgres to be healthy
            until docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U maitai > /dev/null 2>&1; do
                sleep 1
            done
            # Wait for backend to be ready
            log_info "Waiting for backend to be ready..."
            until docker compose -f $COMPOSE_FILE exec -T backend curl -sf http://localhost:8000/health > /dev/null 2>&1; do
                sleep 1
            done
            log_info "Running database migrations..."
            docker compose -f $COMPOSE_FILE exec -T backend alembic upgrade head
            log_info "Rebuild complete. Frontend: http://localhost:3000 | Backend: http://localhost:8000"
            ;;
        logs)
            service=${2:-}
            if [ -n "$service" ]; then
                docker compose -f $COMPOSE_FILE logs -f "$service"
            else
                docker compose -f $COMPOSE_FILE logs -f
            fi
            ;;
        ps)
            docker compose -f $COMPOSE_FILE ps
            ;;
        nuke-db)
            log_warn "This will delete all database data!"
            read -p "Are you sure? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "Stopping services and removing database volume..."
                docker compose -f $COMPOSE_FILE down -v
                log_info "Database nuked. Run './dev.sh local up' to start fresh."
            else
                log_info "Aborted."
            fi
            ;;
        backup)
            backup_file=${2:-"backup-$(date +%Y%m%d-%H%M%S).sql"}
            log_info "Backing up database to $backup_file..."
            docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U maitai maitai > "$backup_file"
            log_info "Backup saved to $backup_file"
            ;;
        restore)
            backup_file=${2:-}
            if [ -z "$backup_file" ]; then
                log_error "Usage: ./dev.sh local restore <backup-file.sql>"
                exit 1
            fi
            if [ ! -f "$backup_file" ]; then
                log_error "Backup file not found: $backup_file"
                exit 1
            fi
            log_warn "This will overwrite the current database!"
            read -p "Are you sure? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "Restoring database from $backup_file..."
                # Drop and recreate database
                docker compose -f $COMPOSE_FILE exec -T postgres psql -U maitai -d postgres -c "DROP DATABASE IF EXISTS maitai;"
                docker compose -f $COMPOSE_FILE exec -T postgres psql -U maitai -d postgres -c "CREATE DATABASE maitai;"
                # Restore from backup
                docker compose -f $COMPOSE_FILE exec -T postgres psql -U maitai maitai < "$backup_file"
                log_info "Database restored from $backup_file"
            else
                log_info "Aborted."
            fi
            ;;
        migrate)
            log_info "Running database migrations..."
            docker compose -f $COMPOSE_FILE exec backend alembic upgrade head
            ;;
        shell)
            service=${2:-backend}
            log_info "Opening shell in $service container..."
            docker compose -f $COMPOSE_FILE exec "$service" /bin/sh
            ;;
        status)
            log_info "Checking service health..."
            docker compose -f $COMPOSE_FILE ps
            echo ""
            log_info "Checking endpoints..."
            curl -s -o /dev/null -w "Frontend (3000): %{http_code}\n" http://localhost:3000 || echo "Frontend (3000): DOWN"
            curl -s -o /dev/null -w "Backend  (8000): %{http_code}\n" http://localhost:8000/health || echo "Backend  (8000): DOWN"
            ;;
        *)
            echo "Local development commands:"
            echo ""
            echo "Usage: ./dev.sh local <command> [options]"
            echo ""
            echo "Commands:"
            echo "  up          Start all services"
            echo "  down        Stop all services"
            echo "  restart     Restart all services"
            echo "  rebuild     Rebuild and restart all services (no cache)"
            echo "  logs [svc]  Tail logs (optionally for specific service)"
            echo "  ps          Show running containers"
            echo "  status      Check service health and endpoints"
            echo "  backup      Backup database to SQL file"
            echo "  restore     Restore database from SQL file"
            echo "  nuke-db     Delete database and start fresh"
            echo "  migrate     Run database migrations"
            echo "  shell [svc] Open shell in container (default: backend)"
            echo ""
            echo "Examples:"
            echo "  ./dev.sh local up"
            echo "  ./dev.sh local logs backend"
            echo "  ./dev.sh local backup mybackup.sql"
            echo "  ./dev.sh local restore mybackup.sql"
            ;;
    esac
}

