# Demo

Reproducerbart presentations-demo för Awesome Journal: en inspelad MP4 med
svenska undertexter och två syntetiska röster, som täcker de flöden som
kraven i [`../docs/Raw_Requirements.md`](../docs/Raw_Requirements.md) kräver.

## Presentation

- **Gamma-dokument:** [Awesome Journal — presentation](https://gamma.app/docs/Awesome-Journal-sutbjt9liz0ezby?follow_on_start=true&following_id=pm3dsbunkjcrnnm&mode=doc)
- **Video:** `out/demo.mp4` (~6,5 min, 1920x1080)
- **Split-screen-video:** `out/demo-parallel.mp4` (~2,5 min, 1920x1080)

> Gamma-dokumentet kräver inloggning. Länken ovan pekar på presentationen som
> följer med inlämningen.

> Videofilmerna ligger i `out/` och är **inte** versionskontrollerade. Kör
> `npm run demo` för att generera dem på nytt från den spårade koden.

## Scener

| # | Scene | Visar |
|---|-------|-------|
| 1 | `intro` | Projektnamn och demo-sammanfattning |
| 2 | `login-doctor` | JWT-login som läkare |
| 3 | `search-patient` | Patientsökning |
| 4 | `records` | Anteckningar i PostgreSQL/SQL |
| 5 | `note-visibility` | `internal` dold, `shared` synlig för patient |
| 6 | `access-log` | Access-loggen och blockchain-verifieringen |
| 7 | `realtime-p2p` | Samma anteckning på två servrar (split-screen) |
| 8 | `patient-view` | Patienten ser bara sina egna uppgifter |
| 9 | `url-tampering` |byte av `userId` i URL blockeras |
| 10 | `unauthorized` | Obehörig roll nekas journal |
| 11 | `primary-care` | Vårdcentral får delat underlag |
| 12 | `outro` | Sammanfattning |

## Köra själv

Kräver två körande servrar, en seedad databas och Chromium:

```bash
# 1. Seed + bygg
npx prisma generate && node prisma/seed.js
npm run build

# 2. Två servrar, peer:ad med varandra
SERVER_ID=hospital-s PEER_URL=http://localhost:3002 npm run start -- -p 3001
SERVER_ID=ambulance-a PEER_URL=http://localhost:3001 npm run start -- -p 3002

# 3. Demo
npm run demo
```

`npm run demo` = `demo:narrate` → `demo:record` → `demo:compose`.

| Script | Gör |
|--------|-----|
| `npm run demo:narrate` | Genererar en MP3 per undertext med `edge-tts` till `out/audio/` |
| `npm run demo:record` | Spelar in varje scen till `out/raw/` och skriver `out/timeline.json` |
| `npm run demo:compose` | Lägger ihop `out/demo.mp4` med ton och bild i takt |

### Två versioner

`DEMO_SET` väljer vilken inspelning som görs:

| Variabel | Utdata |
|----------|--------|
| `DEMO_SET=main` (standard) | `out/demo.mp4` — den linjära genomgången av alla krav |
| `DEMO_SET=parallel` | `out/demo-parallel.mp4` — split-screen med båda servrarna sida vid sida |

`DEMO_SCENES=par-setup,par-realtime` spelar bara in några scener, vilket är det
som gör att en enskild takt går att iterera på.

### Undertexter

`captions.ts` är enda källan för all text. Samma sträng används för toasten
i bilden och för talet, så undertext och röst aldrig kan glida isär.

| Fält | Värde |
|------|-------|
| Röster | `sv-SE-SofieNeural`, `sv-SE-MattiasNeural` |
| Hastighet | `-6%` |

Texten ändras i `captions.ts`, sedan `npm run demo:narrate && npm run demo:record
&& npm run demo:compose`.

### Utdata

`out/` är genererat och **versionseras inte**:

- `out/demo.mp4`, `out/demo-parallel.mp4` — färdiga presentationer
- `out/audio/` — röstklipp + `index.json` (längder, text, talare)
- `out/raw*/` — oredigerade skärminspelningar per scen och lane
- `out/segments*/` — ffmpeg-delsteg
- `out/timeline*.json` — scenordning och undertexternas tidsstämplar

Allt i `out/` går att återskapa med `npm run demo` från den spårade koden, så
det finns ingen anledning att checka in ~40 MB video och ljud.

## Anteckningar om inspelningen

- **Markören.** Playwright spelar inte in OS-pekaren. `human.ts` lägger därför
  in en egen DOM-markör som följer musen, med en mjuk ring när något klickas.
- **Inmatning.** Tangenttryck sker tecken för tecken med varierad fördröjning,
  inte `fill()`, så videon ser ut att bli skriven för hand.
- **Rörelse.** Musen färdas längs en kurva med lätt avdrift, och scroll sker i
  små steg — inte i en enda `scrollTo`.
- **Videokodning.** Ffmpeg på maskinen saknar `libx264`, så compose steget
  använder `libopenh264` med fast bithastighet i stället för CRF.

## Miljövariabler

| Variabel | Standard | Beskrivning |
|----------|----------|-------------|
| `DEMO_SET` | `main` | `main` eller `parallel`, se [Två versioner](#två-versioner) |
| `DEMO_SCENES` | alla scener | Kommaseparerad lista, t.ex. `DEMO_SCENES=records,outro` |
| `SERVER_1` | `http://localhost:3001` | Värdsjukhuset |
| `SERVER_2` | `http://localhost:3002` | Ambulansen |
| `DATABASE_URL` | från `.env` | Seedas och rensas av `record.spec.ts` |

Inspelningen skriver rader och städer upp dem efter sig via `deleteDemoNotes`,
så körningen går att upprepa.
