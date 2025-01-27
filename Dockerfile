FROM node:lts-alpine
WORKDIR /www/fotrino-films/
COPY ./ ./
RUN yarn install && yarn global add @quasar/cli && quasar build -m spa && yarn cache clean && rm -rf node_modules && addgroup -S fotrino && adduser -S fotrino -G fotrino
EXPOSE 4000
USER fotrino
CMD ["quasar", "serve", "-p", "4000", "-H", "0.0.0.0", "/www/fotrino-films/dist/spa/", "--history"]
