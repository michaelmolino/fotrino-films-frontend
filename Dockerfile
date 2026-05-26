FROM nginxinc/nginx-unprivileged:alpine
COPY --chmod=0555 dist/spa/ /usr/share/nginx/html/
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 4000
USER 101:101
CMD ["nginx", "-g", "daemon off;"]
