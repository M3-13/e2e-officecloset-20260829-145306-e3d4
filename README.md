# Glamouröser Kleiderschrank-Manager

Ein Fullstack-Web-App im Hollywood-Stil, in der Benutzer sich registrieren, ihre Garderobe mit Kleidungsstücken samt Bildern und frei anlegbaren Kategorien verwalten und im Outfit-Creator mehrere Einzelteile zu gespeicherten Outfits kombinieren. Elegante Red-Carpet-Optik mit warmem, fast schwarzem Hintergrund und Champagner-Gold-Akzenten.

## Tech Stack

- **Backend**: Python mit FastAPI
- **Datenbank**: SQLite (über SQLAlchemy)
- **Bild-Speicherung**: lokales Dateisystem
- **Frontend**: Vite mit React (in einem separaten Ticket)
- **Sprache**: Python + TypeScript

## Installation

```bash
cd backend
py -m pip install -r requirements.txt
```

## Start (Development)

```bash
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Der Server startet unter `http://localhost:8000` und legt die SQLite-Datenbank (`wardrobe.db`) sowie das Schema automatisch beim Start an. Einfacher Health-Check:

```bash
curl http://localhost:8000/api/health
# -> {"status":"ok"}
```

### Konfiguration (Umgebungsvariablen)

| Variable | Default | Zweck |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./wardrobe.db` | Datenbank-Verbindung |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | einzig erlaubte CORS-Origin (mit Credentials) |

## API-Endpunkte

Alle Endpunkte liegen unter dem Prefix `/api`. Fehlerantworten haben die Form `{"detail": "<meldung>"}`; Validierungsfehler liefern `422`.

### Auth

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{"email": str, "password": str}` | `201` `{"user": UserOut}` (setzt HttpOnly-Cookie `session`) |
| POST | `/api/auth/login` | `{"email": str, "password": str}` | `200` `{"user": UserOut}` oder `401` |
| POST | `/api/auth/logout` | – | `204` |
| GET | `/api/auth/me` | – | `200` `{"user": UserOut}` oder `401` |

### Kategorien

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| GET | `/api/categories` | – | `200` `[CategoryOut]` |
| POST | `/api/categories` | `{"name": str}` | `201` `CategoryOut` |
| DELETE | `/api/categories/{id}` | – | `204` oder `404` |

### Kleidungsstücke (Items)

| Methode | Pfad | Body / Query | Antwort |
| --- | --- | --- | --- |
| GET | `/api/items?category_id=&q=` | `category_id`, `q` optional | `200` `[ItemOut]` |
| POST | `/api/items` | `{"name", "category_id", "description"?, "image_filename"?}` | `201` `ItemOut` |
| GET | `/api/items/{id}` | – | `200` `ItemOut` oder `404` |
| PATCH | `/api/items/{id}` | teilweise Updates | `200` `ItemOut` |
| DELETE | `/api/items/{id}` | – | `204` oder `404` |

### Bilder

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| POST | `/api/images` | multipart `file` | `201` `{"filename": str}`; `413` bei > 5 MB |
| GET | `/api/images/{filename}` | – | `200` Bild oder `404` |

### Outfits

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| GET | `/api/outfits` | – | `200` `[OutfitOut]` |
| POST | `/api/outfits` | `{"name": str, "item_ids": [int]}` | `201` `OutfitOut` |
| DELETE | `/api/outfits/{id}` | – | `204` oder `404` |

### Konto

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| DELETE | `/api/account` | – | `204` |

### Datenformen

- `UserOut`: `{"id": int, "email": str}`
- `CategoryOut`: `{"id": int, "name": str}`
- `ItemOut`: `{"id": int, "name": str, "category_id": int, "description": str | null, "image_url": str | null}` (`image_url` = `/api/images/{filename}`)
- `OutfitOut`: `{"id": int, "name": str, "item_ids": [int], "items": [ItemOut]}`

### Auth-Modell

Die Sitzung ist ein zufälliges Token, von dem nur der Hash in der Datenbank liegt; das Cookie `session` ist `HttpOnly` mit `SameSite=lax`. Geschützte Routen prüfen die Sitzung über `get_current_user(request, db)`. Das Frontend sendet `credentials: "include"`.

## Features

- Registrierung, Login und Sitzungsverwaltung
- Kategorien anlegen, auflisten und löschen
- Kleidungsstücke mit Bild-Upload (Größenlimit 5 MB) anlegen, bearbeiten, filtern, suchen und löschen
- Outfits aus mehreren Kleidungsstücken kombinieren, speichern und löschen
- Kontolöschung mit vollständiger Datenbereinigung

## Tests

```bash
cd backend
PYTHONPATH=. py -m pytest
```
