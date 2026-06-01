# Fotrino Films Frontend

![GitHub](https://img.shields.io/github/license/michaelmolino/fotrino-films-frontend?style=for-the-badge)
[![Sonar Violations](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)

Fotrino Films is a personal video hosting platform focused on private sharing with family and friends. This repository contains the frontend single-page application built with [Quasar](https://quasar.dev/) and [Vue 3](https://vuejs.org/).

## Project Status

This project is under active development and should be considered pre-production.

## Demo

[![Live Demo](https://img.shields.io/badge/Visit-Live%20Demo-1f7a8c?style=for-the-badge)](https://films.fotrino.com/)

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

## Related Repositories

- Backend API and workers: private repository (Flask, Postgres, Redis, Procrastinate, ffmpeg)
- End-to-end tests: private repository (Cypress)

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Yarn Classic](https://classic.yarnpkg.com/) >= 1.21

No global Quasar CLI installation is required for local development.

## Getting Started

1. Install dependencies:

```bash
yarn install
```

1. Run the app in development mode:

```bash
yarn quasar dev
```

1. Configure API proxy/back-end target in `quasar.config.js` for your local environment.

## Useful Scripts

- `yarn lint` - run ESLint
- `yarn format` - run Prettier and auto-fix lint issues in `src/**/*.{js,vue}`
- `yarn build:analyze` - build SPA bundle with analyzer enabled
- `yarn coverage` - start dev server with coverage instrumentation

## License

Licensed under the terms in [LICENSE.txt](LICENSE.txt).
