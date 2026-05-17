FROM node:lts-alpine
WORKDIR /www/fotrino-films/
COPY dist/spa/ dist/spa/
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN yarn global add @quasar/cli \
	&& addgroup -S fotrino \
	&& adduser -S fotrino -G fotrino \
	&& chmod +x /usr/local/bin/docker-entrypoint.sh \
	&& chown -R fotrino:fotrino /www/fotrino-films
EXPOSE 4000
USER fotrino
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
