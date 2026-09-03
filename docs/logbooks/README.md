# Loggbok — per person

Kurskravet är att projektet dokumenteras i repot: **minst 2 möten per vecka** ska antecknas i `docs/meetings/`, och gruppkontraktmallen säger att vi **fyller i en loggbok dagligen med vår daily**.

Därför ligger en CSV per person här. Det är vår dagliga logg över vad vi gjort, vad som blockerar och vad som händer härnäst — plus att mötesdeltagande syns.

## Filer

| Fil | Person | Person-roll (fylls i efter kickoff) |
|---|---|---|
| `loggbok-Kassim10.csv` | Kassim Segerberg | TBD |
| `loggbok-rcilomba.csv` | Ramadan | TBD |
| `loggbok-umoraghad0-del.csv` | Najma Hasan | TBD |
| `loggbok-matdevstamp.csv` | Matias Marti | TBD |

## Kolumner

| Kolumn | Innehåll |
|---|---|
| `datum` | `YYYY-MM-DD` |
| `typ` | `daily`, `mote` (planering/retro/backlog), `kodning`, `dokumentation`, `annat` |
| `vad_gjorde_jag` | Kort: vad gjorde jag idag/på mötet? |
| `blockerare` | Något som hindrar mig (annars `-`) |
| `nasta_steg` | Vad gör jag härnäst? |
| `relaterat` | Task/issue/PR-ref om det finns, t.ex. `#13` eller `docs/draft_tasks/13-...` |
| `anteckning_eller_lank` | Länk till mötesanteckning i `docs/meetings/` eller annan referens |

Exempelrad:

```
2026-09-04,daily,Intro + setup check på kickoff,-,Skriv klart gruppkontraktet,#1,docs/meetings/2026-09-04-kickoff-agenda.md
```

## Rutin

1. **Varje vardag:** lägg en rad med `typ=daily` (det som kom upp på dagens standup — se [gruppkontraktet](../../gruppkontrakt.md#6-loggbok-dokumentation)).
2. **Efter varje möte:** lägg en rad med `typ=mote` och länka anteckningen i `docs/meetings/`.
3. Commit:a samma dag så loggen ligger i git-historiken.

## Vecko-koll (kurskrav: minst 2 dokumenterade möten/vecka)

| Vecka | Mötesanteckningar i `docs/meetings/` | Dagliga rader inlagda | OK? |
|---|---|---|---|
| 1 (2–8 sep) | kickoff 4 sep + TBD | TBD | ☐ |
| 2 (9–15 sep) | TBD | TBD | ☐ |
| 3 (16–22 sep) | TBD | TBD | ☐ |
| 4 (23–29 sep) | TBD | TBD | ☐ |
| 5 (30 sep–2 okt) | TBD | TBD | ☐ |

## Öppet beslut (tas på kickoff, se gruppkontraktet)

- **Default:** CSV här i repot (alla kan ändå öppna dem i Excel/Sheets).
- **Alternativ:** GitHub-nativ logg (dagliga rader i PR/issues + mötesanteckningar; ingen egen fil per person).
- **Alternativ:** riktig Excel/.xlsx eller Google Sheet externt — då krävs en **ägare som inte är Matias**. Den ägaren skrivs in i gruppkontraktet och en sammanfattning speglas hit varje vecka.

Valet antecknas i kickoff-mötesanteckningen och i gruppkontraktet.
