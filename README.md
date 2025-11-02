# Fotrino Films

![GitHub](https://img.shields.io/github/license/michaelmolino/fotrino-films-frontend?style=for-the-badge)

Fotrino Films is a video content hosting platform. It is designed for users to be able to upload content and share it easily with family and friends. It is not designed for monetisation or content discovery.

This project is actively being developed and is not yet ready for use.

## [Demo Site](https://films.fotrino.com/)

[![Chromium HSTS preload](https://img.shields.io/hsts/preload/films.fotrino.com?style=for-the-badge)](https://hstspreload.org/?domain=films.fotrino.com)
[![SSL Labs SSL Server Test](https://img.shields.io/badge/SSL%20LABS-A%2B-brightgreen?style=for-the-badge)](https://www.ssllabs.com/ssltest/analyze.html?d=films.fotrino.com)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade/films.fotrino.com?publish&style=for-the-badge)](https://observatory.mozilla.org/analyze/films.fotrino.com)

Note that I regularly delete the DB and content so please don't upload important files.

## Tests

[![Sonar Violations (short format)](https://img.shields.io/sonar/violations/michaelmolino_fotrino-films-frontend?label=sonar%20violations&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/dashboard?id=michaelmolino_fotrino-films-frontend)
[![Lighthouse Performance](https://img.shields.io/badge/dynamic/json?color=blue&style=for-the-badge&label=Performance&query=lighthouseResult.categories.performance.score&url=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://films.fotrino.com/9944fa03-8a73-4e52-84bc-e8a514bd1271/Sample-Channel/Nature/The-Endless-Ocean&key=AIzaSyBZl8x7vHvyye4AN9-MGks5t0U7snkTDLU)](https://pagespeed.web.dev/analysis/https-films-fotrino-com-9944fa03-8a73-4e52-84bc-e8a514bd1271-Sample-Channel-Nature-The-Endless-Ocean/l46nms1mcf?form_factor=mobile&category=performance&category=accessibility&category=best-practices&category=seo&hl=en-GB)
[![Lighthouse Accessibility](https://img.shields.io/badge/dynamic/json?color=blue&style=for-the-badge&label=Accessibility&query=lighthouseResult.categories.accessibility.score&url=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://films.fotrino.com/9944fa03-8a73-4e52-84bc-e8a514bd1271/Sample-Channel/Nature/The-Endless-Ocean&key=AIzaSyBZl8x7vHvyye4AN9-MGks5t0U7snkTDLU)](https://pagespeed.web.dev/analysis/https-films-fotrino-com-9944fa03-8a73-4e52-84bc-e8a514bd1271-Sample-Channel-Nature-The-Endless-Ocean/l46nms1mcf?form_factor=mobile&category=performance&category=accessibility&category=best-practices&category=seo&hl=en-GB)

Cypress tests are in a private repo.

## Backend

The backend is written in Python and is in a private repo.

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

Note: You'll need to proxy the backend somewhere in `quasar.config.js`.
