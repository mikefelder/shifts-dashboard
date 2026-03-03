# Multi-stage build for Shift Dashboard Frontend

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files from client subdirectory
COPY client/package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code from client subdirectory
COPY client/ .

# Build application with Vite
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:1.27-alpine AS production

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for nginx user (already exists in base image)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose frontend port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
