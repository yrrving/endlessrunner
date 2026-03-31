# Render Deploy Ready

Detta ar de tva tjansterna som ar forberedda for Render.

## 1. Endlessrunner

- Repo: `https://github.com/yrrving/endlessrunner`
- Service name: `endlessrunner`
- Runtime: `node`
- Plan: `starter`
- Persistent disk: ja
- Disk mount path: `/var/data`
- `DATA_DIR`: `/var/data/endlessrunner`

Miljovariabler:

- `PORT=3000`
- `DATA_DIR=/var/data/endlessrunner`
- `RESEND_API_KEY=<er riktiga nyckel>`
- `MAIL_FROM=onboarding@resend.dev`
- `MAIL_TO=accounts@trainstation.se`
- `GAME_MAIL_TAG=[ENDLESSRUNNER][ARSMOTE 2026]`

## 2. Muggmaskin

- Repo: `https://github.com/yrrving/trainstation-muggdesigner`
- Service name: `trainstation-muggdesigner`
- Runtime: `docker`
- Plan: `starter`
- Persistent disk: nej

Miljovariabler:

- `PORT=3001`
- `RESEND_API_KEY=<er riktiga nyckel>`
- `MAIL_FROM=onboarding@resend.dev`
- `MAIL_TO=accounts@trainstation.se`
- `MUGG_MAIL_TAG=[MUGGDESIGN][ARSMOTE 2026]`

## Vad som aterstar i Render

1. Logga in pa Render.
2. Skapa eller importera bada web services fran GitHub-repona.
3. Kontrollera att miljo-variablerna ovan ar satta.
4. For `endlessrunner`, bekrafta persistent disk.
5. Valt plansteg ar det sista stallet dar betalning behovs.
