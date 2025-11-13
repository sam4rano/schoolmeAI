#!/bin/bash

echo "=== Docker Compose Health Check ==="
echo ""

# Check all services
docker-compose ps

echo ""
echo "=== Detailed Health Status ==="
echo ""

# Check each service individually
for service in app postgres redis; do
  container_id=$(docker-compose ps -q $service 2>/dev/null)
  if [ -n "$container_id" ]; then
    health=$(docker inspect $container_id --format='{{.State.Health.Status}}' 2>/dev/null)
    status=$(docker inspect $container_id --format='{{.State.Status}}' 2>/dev/null)
    echo "$service: Status=$status, Health=$health"
  else
    echo "$service: Not running"
  fi
done

echo ""
echo "=== Testing Health Endpoint ==="
echo ""

# Test the app health endpoint
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✓ App health endpoint is responding"
  curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
else
  echo "✗ App health endpoint is not responding"
fi

echo ""
echo "=== Recent Logs (last 10 lines) ==="
echo ""
docker-compose logs --tail=10 app

