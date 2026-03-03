#!/bin/sh
# Frontend entrypoint script - generates runtime configuration

# Create runtime config file
cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  apiUrl: '${VITE_API_BASE_URL:-http://localhost:3000}'
};
EOF

echo "Runtime configuration generated:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
