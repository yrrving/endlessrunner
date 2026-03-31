# Endlessrunner for arsmotet

Ett enkelt touchanpassat kioskspel dar besokaren:

1. startar kameran och tar en selfie
2. far sitt ansikte pa en springande figur
3. knackar pa dorrar for att samla poang
4. fyller i namn och e-post efter game over
5. hamnar pa highscore-listan i `/tv`

## Starta lokalt

```bash
npm install
npm start
```

Oppna:

- `http://localhost:3000/` for kioskvyn
- `http://localhost:3000/tv` for highscore-TV

## E-post

Projektet anvander nu samma Resend-upplagg som `muggmaskin`. Kopiera `.env.example` till `.env` och
fyll i:

```env
PORT=3000
DATA_DIR=./data
RESEND_API_KEY=re_your_resend_api_key
MAIL_FROM=onboarding@resend.dev
MAIL_TO=accounts@trainstation.se
GAME_MAIL_TAG=[ENDLESSRUNNER][ARSMOTE 2026]
```

Om mejl inte ar korrekt konfigurerat sparas resultatet fortfarande lokalt i `data/scores.json`, och
spelarbilden sparas dessutom i `data/submissions/`.

## Render

Spelet kan deployas pa Render. Om ni vill att highscore och sparade bilder ska overleva restarts och
redeploys, satt `DATA_DIR` till en path pa er persistent disk, till exempel `/var/data/endlessrunner`,
och attacha en persistent disk till tjansten.

Det finns en forberedd `render.yaml` i projektet.

## Monterupplagg

- Kioskdator pa `/`
- TV eller extern skarm pa `/tv`
- Tryck pa skarmen for att knacka pa dorrar
- Spelaren forlorar efter tre missade dorrar
