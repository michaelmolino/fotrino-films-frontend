# Fotrino Films

![GitHub](https://img.shields.io/github/license/michaelmolino/fotrino-films-frontend?style=for-the-badge)
[![Sonar Violations (short format)](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)

Fotrino Films is a video content hosting platform. It is designed for users to be able to upload content and share it easily with family and friends.

This project is actively being developed and is not yet ready for use.

### Tests?!

This project only has one developer, is not used in production, and the behaviour changes at my whim! When it is more stable I will add tests.

## [Demo Site](https://films.fotrino.com/)

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

Feel free to use this live demo as a playground. It is always the most up to date version of the code. Note that I regularly delete the DB and content so don't use it to actually store anything important!

## Backend

The backend is written in Python. I may make the source code available in the future, but currently it is private.

## Development

### Dependencies

```bash
yarn install
yarn global add @quasar/cli
```

### Run

```bash
quasar dev
```

Note: You'll need to proxy the backend somewhere in `quasar.conf.js`.
