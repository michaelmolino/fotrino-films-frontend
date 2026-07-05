# Fotrino Films

Fotrino Films is a personal video hosting platform built for private sharing with family and friends. There are no trackers, no pushy discovery algorithms, and no annoying ads or overlays. If most platforms are designed to pay you for content, this one is designed for you to pay for hosting.

## Project Status

This project is under active development and should be considered pre-production.

## Demo

[![Live Demo](https://img.shields.io/badge/Visit-Live%20Demo-1f7a8c?style=for-the-badge)](https://films.fotrino.com/)
![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m790680436-a2d6dce12fb55d496ecc9bd2?style=for-the-badge&label=Status%20Monitor&link=https%3A%2F%2Fstats.uptimerobot.com%2F7YZWdybJAr)

The demo runs on a small deployment for evaluation purposes. It is not representative of production scale or performance characteristics. The service may be intermittently unavailable due to maintenance, resets, or resource constraints.

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

## Architecture & Development

![Architecture Diagram](./docs/fotrino-architecture.png)

### Public Components

- Frontend - This repository, a single-page application built with [Quasar](https://www.quasar.dev/) (Vue).

  [![Sonar Violations](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)

### Private Components

- Backend
  - API - A [Flask](https://flask.palletsprojects.com/en/stable/) (Python) application.

    [![OpenAPI Docs](https://img.shields.io/badge/Visit-OpenAPI%20Docs-CAA8F5?style=for-the-badge)](https://openapi.fotrino.com/)

  - Async Worker - Runs asynchronous media workflows (transcoding, HLS packaging, image conversion, and deletion) with [Procrastinate](https://procrastinate.readthedocs.io/en/stable/index.html) and [ffmpeg](https://ffmpeg.org/). Jobs are persisted in Postgres rather than an external queue, a deliberate architectural choice for reliability and operational simplicity.

- Cypress Tests - End-to-end tests covering key user journeys.
- Infrastructure
  - Prerenderer - Serves prerendered pages with metadata for bots that do not execute JavaScript (mostly so link previews work).
  - Session Validator - Ensures users have a valid media session before serving assets from a private bucket.
  - Terraform - All infrastructure is deployed via Terraform.
  - Environment Variables (no secrets) - Required production environment variables.

## AI Usage

Fotrino is built by a human, with AI used as a development tool.

I use AI to brainstorm ideas, explain unfamiliar concepts, review code, and, yes, sometimes generate code. Every change is reviewed, understood, tested, and often rewritten before it becomes part of the project.

This is not "vibe coding." The architecture, design decisions, implementation, and long-term direction of Fotrino are deliberate and maintained by me. AI helps me work faster, but it doesn't make the decisions.
