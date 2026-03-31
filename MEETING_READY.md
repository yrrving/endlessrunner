# Meeting Ready

Detta projekt, `endlessrunner`, ar forberett for att snabbt kunna delas pa ett mote.

## Redo nu

- Render-konfig finns i `render.yaml`
- mejl ar forberett via Resend
- highscore kan nollstallas fran kiosken och TV-vyn
- persistent lagring kan styras med `DATA_DIR`

## Innan mote

1. Se till att projektet finns i GitHub.
2. Se till att Render-tjansten ar skapad eller att repot ar kopplat.
3. Kontrollera att miljo-variablerna finns i Render.
4. Kor `scripts/preflight.sh` lokalt eller mot deployad URL.

## Under mote

1. Starta eller vack Render-tjansten.
2. Hamta spel-lanken.
3. Hamta muggmaskin-lanken.
4. Skicka bada i chatten.

## Snabbkommando

```bash
./scripts/preflight.sh
```

Eller mot publik URL:

```bash
./scripts/preflight.sh https://din-app.onrender.com
```
