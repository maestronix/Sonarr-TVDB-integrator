# TVDB → Sonarr Integrator

Eine Tampermonkey-Userscript, das auf den Seiten thetvdb.com und thetvdb.org einen „+ Add to Sonarr“-Button einfügt, um Serien per TVDB-ID direkt zu Sonarr hinzuzufügen.

## Features

- **Inline-Button**: Inline-Button hinter dem Serientitel auf der Such- und auf Detailseiten.
- **Suchergebnisse**: Buttons nur bei Einträgen mit „Series #ID“ im Suchergebnis. Filme werden ignoriert
- **Lookup & Add**: Nutzt Sonarr API v3 Lookup-Endpoint für vollständige Metadaten und fügt Serie via TVDB-ID korrekt hinzu.
- **Status-Popup**: Vollbild-Overlay mit pulsierendem Kreis:
  - **Loading**: „Adding to Sonarr...“
  - **Success**: Grüner Kreis + „Added successfully“
  - **Error**: Roter Kreis + ausführliche Fehlermeldung
- **Konfiguration**: URL, API-Key, Qualitätsprofil, Root-Folder, Monitoring, Season-Folder.
- **Debugging**: `console.log`-Ausgaben für jeden Schritt.

## Installation

1. Installiere die **Tampermonkey**-Erweiterung in deinem Browser.
2. Erstelle ein neues Userscript und kopiere den Code aus **`thetvdb-sonarr.user.js`** hinein.
3. Passe am Anfang des Scripts folgende Variablen an:
   ```js
   const SONARR_URL         = 'http://localhost:8989';  // URL deiner Sonarr-Instanz
   const SONARR_API_KEY     = 'DEIN_SONARR_API_KEY';   // API-Key
   const QUALITY_PROFILE_ID = 1;                       // z.B. Standard HD
   const ROOT_FOLDER_PATH   = '/tv';                   // Pfad für Serien
   const MONITORED          = true;                    // direkt überwachen
   const SEASON_FOLDER      = true;                    // Staffel-Ordner anlegen
   ```
4. Speichere das Script und lade die thetvdb.com Seite neu.

## Nutzung

- Öffne eine **Serien-Detailseite** oder eine **Suchseite** auf thetvdb.com.
- Klicke auf den **+ Add to Sonarr**-Button neben dem Titel.
- Das Overlay zeigt dir „Adding to Sonarr...“, danach Erfolg oder spezifische Fehlermeldung.

## Troubleshooting

- **API-Verbindung**: Stelle sicher, dass `SONARR_URL` erreichbar ist und der **API-Key** stimmt.
- **Konsole**: Öffne die Developer-Tools (F12) und prüfe die Logs.
- **Fehler**: Bei „This series has already been added“ ist die Serie bereits vorhanden.

## Lizenz

MIT License

