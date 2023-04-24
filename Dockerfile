FROM node:18-alpine
WORKDIR /www/fotrino-films/
COPY ./ ./
RUN yarn install
RUN yarn global add @quasar/cli
RUN quasar build -m spa
RUN yarn cache clean
RUN rm -rf node_modules
EXPOSE 4000
RUN addgroup -S fotrino && adduser -S fotrino -G fotrino
USER fotrino
CMD quasar serve -p 4000 -H 0.0.0.0 dist/spa/ --history
