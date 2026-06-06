# Fotrino Films Frontend

[![Sonar Violations](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)

Fotrino Films is a personal video hosting platform focused on private sharing with family and friends. This repository contains the frontend single-page application built with [Quasar](https://quasar.dev/) and [Vue 3](https://vuejs.org/).

## Project Status

This project is under active development and should be considered pre-production.

## Demo

[![Live Demo](https://img.shields.io/badge/Visit-Live%20Demo-1f7a8c?style=for-the-badge)](https://films.fotrino.com/)

The demo runs on a small, single-instance deployment for evaluation purposes. It is not representative of production scale or performance characteristics. The service may be intermittently unavailable due to maintenance, resets, or resource constraints.

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

## Related Repositories

The following components are maintained in private repositories.

- Backend: Python API built with Flask, using Postgres and Redis for persistence and caching.
- Worker: Asynchronous job processing handled via Procrastinate, with ffmpeg used for media processing.
- Tests: End-to-end test suite written in Cypress, covering key user flows and system behaviour.

## OpenAPI Docs

[![OpenAPI Docs](https://img.shields.io/badge/Visit-OpenAPI%20Docs-CAA8F5?style=for-the-badge)](https://openapi.fotrino.com/)

These docs are a work in progress. They may be incomplete or may not always reflect the latest implementation details. If something looks incorrect, the API behaviour should be considered the source of truth.

## License

Licensed under the terms in [LICENSE.txt](LICENSE.txt).
