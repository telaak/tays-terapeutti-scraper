# Pirhan Terapeuttihakemiston "raaputin"

Ohjelma, jolla voidaan "raaputtaa" Pirhan terapeuttihakemistosta terapeutit huomattavasti helpommin käsiteltävään JSON-muotoon.

## Kuvaus

Ohjelma hakee Pirhan terapeuttisivuilta [https://www.pirha.fi/web/psykoterapeuttirekisteri/](https://www.pirha.fi/web/psykoterapeuttirekisteri/)

### Dokumentaatio

TODO

## Aloittaminen

### Vaatimukset

* Node.js

### Asentaminen

1. `git pull github.com/telaak/tays-terapeutti-scraper.git`
2. Asenna paketit `npm i`
3. Aja TypeScript compiler `npx tsc`
4. Täytä ympäristömuuttujat:
      * API_URL (osoite minne ohjelma lähettää terapeuttien JSON:n HTTP POST:lla)
      * PARSE_ON_BOOT (jos "true", ohjelma aloittaa heti käynnistyessään käydä läpi terapeutteja)
      * CRON (ajastettua toistoa varten, katso cron:n dokumentaatio)
5. Käynnistä ohjelma `node ./dist/index.js`

### Docker

## Build

* `docker build -t username/tays-terapeutti-scraper`

## Compose

```
services:
    
  scraper:
    image: telaaks/tays-terapeutti-scraper
    restart: unless-stopped
    environment:
      - API_URL=http://
     # - PARSE_ON_BOOT=true
     # - CRON=15 20 * * *
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
