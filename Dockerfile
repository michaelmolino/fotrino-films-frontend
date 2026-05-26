FROM nginxinc/nginx-unprivileged:alpine
COPY --chown=101:101 --chmod=0555 dist/spa/ /usr/share/nginx/html/
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 4000
CMD ["nginx", "-g", "daemon off;"]
