FROM nginx:latest

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY dist/broad-leaf-store-admin-site/browser /usr/share/nginx/html
COPY nginx.conf  /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
