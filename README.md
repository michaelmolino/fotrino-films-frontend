# Fotrino Films

![GitHub](https://img.shields.io/github/license/michaelmolino/fotrino-films-frontend?style=for-the-badge)

Fotrino Films is a video content hosting platform. It is designed for users to be able to upload content and share it easily with family and friends. It is not designed for monetisation or content discovery.

This project is actively being developed and is not yet ready for use.

## [Demo Site](https://films.fotrino.com/)

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

The site is not ready for production use - I reserve the right to delete your content.

## Code

### Frontend

- The frontend is an [SPA](https://en.wikipedia.org/wiki/Single-page_application) built with [Quasar](https://quasar.dev/), a framework based on [Vue](https://vuejs.org/).

### Backend

- A [Python Flask](https://flask.palletsprojects.com/en/stable/) service exposes the main API which persists data to a [Postgres DB](https://www.postgresql.org/docs/current/index.html). Most `GET` requests are cached in [Redis](https://redis.io/docs/latest/).
- Media processing is handled asynchronously using [Procrastinate](https://procrastinate.readthedocs.io/en/stable/index.html).
- Media processing is handled by [ffmpeg](https://ffmpeg.org/).
- The backend is stored in a private repo that is not open source.

### Tests

- End to end tests written in [Cypress](https://www.cypress.io/) are in a private repo and not open source.

## Development

[![Sonar Violations (short format)](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)

### Dependencies

```bash
yarn install
yarn global add @quasar/cli
```

### Run

```bash
quasar dev
```

Note: You'll need to proxy the backend somewhere in `quasar.config.js`.
