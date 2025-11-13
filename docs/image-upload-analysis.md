# Analyse: ImageUploadComponent

Diese Datei analysiert die Komponente `ImageUploadComponent` hinsichtlich Best Practices, Logik, Robustheit und Verhalten bei langsamen Verbindungen. Stand: aktuelle Chat-Version.

## Kurz-Zusammenfassung
- Stärken: OnPush-Change-Detection mit explizitem `markForCheck`, klare Validierung (MIME, Größe), sauberes Drag&Drop + Click-Upload, Vorschaurendering lokal via FileReader, Trennung von Media-IDs per Output.
- Schwächen/Verbesserungen: Kein Lade-/Fortschrittszustand, potenziell teure/nebenwirkungsreiche Re-Uploads, asynchroner Bug bei `Array.find(async ...)`, A11y-Verbesserungen (Keyboard, ARIA), i18n mit Literaltexten (statt Keys), Duplikatvermeidung, keine Upload-Kontingentierung/Abbruch, Debug-Logs im Produktivcode.

---

## Logik & Datenfluss
- Inputs:
  - `previews: string[]`: enthält entweder HTTP-URLs (bestehende Medien) oder JSON-kodierte DataURLs inklusive Metadaten (fileName, mimeType).
  - `existingImages: RecordId<'media'>[]`: IDs bereits hochgeladener Medien.
  - `eventName: string`: Basis für generierte Dateinamen.
- Outputs:
  - `previewsChange`: wird bei Änderungen der Vorschau emittiert.
  - `mediaIdsChange`: wird nach `uploadImages()` mit allen Media-IDs emittiert.

- Lifecycle:
  - `ngOnInit()`: ruft `loadExistingImagesIfPresent()`, lädt bestehende Bilder in `previews`, aber nur, wenn `previews` noch leer ist (Double-Load-Schutz).
  - `ngOnChanges()`: wenn `existingImages` neu gesetzt wird und Werte enthält, erneut `loadExistingImagesIfPresent()`.

- Dateiannahme/Validierung:
  - `handleFiles()`: Filtert auf image/png|jpeg, maximale Größe 5 MB. Erzeugt pro Datei eine Vorschau via `createPreview()`.

- Vorschauerzeugung:
  - `createPreview(file)`: `FileReader` -> `dataUrl`, wrapper als JSON-String `{ dataUrl, fileName, mimeType }` in `previews`, `previewsChange.emit` und `markForCheck()`.

- Bestehende Bilder nachladen:
  - `loadExistingImages()`: ermittelt pro Media-ID die URL über `mediaService.getMediaUrl(image)`; fügt HTTP-URLs in `previews` ein (nur wenn noch nicht vorhanden).

- Entfernen:
  - `removeImage(i)`: entfernt Preview lokal, versucht bei HTTP-URL das zugehörige Media in DB zu löschen (`getMediaByUrl` -> `deleteMedia`), danach ruft es `uploadImages()` und emittiert die neuen IDs. Potenziell teuer, weil Upload/Lookup aller verbleibenden Einträge erneut erfolgt.

- Upload:
  - `uploadImages()`:
    - Sammelt IDs für alle HTTP-URLs (bereits existierende Medien). Falls `getMediaByUrl` keine ID liefert, versucht es ein Fallback via `existingImages.find(async ...)` (Bug, siehe unten).
    - Extrahiert neue Bilder (nicht-HTTP), parst JSON, bildet `StringRecordId` mit `Date.now()` und postet per `mediaService.postMedia`.
    - Emittiert `mediaIdsChange` mit der kombinierten Ergebnisliste.

---

## Verhalten bei langsamen Internetverbindungen
- Vorschauerzeugung (FileReader) ist lokal und sofort sichtbar – das ist gut für UX.
- Upload:
  - Alle neuen Dateien werden parallel via `Promise.all` hochgeladen. Bei langsamer Verbindung führt das zu:
    - Langer Wartezeit ohne visuelle Rückmeldung (kein Ladeindikator / Fortschritt).
    - Möglicher Serverüberlastung (keine Limitierung der Parallelität).
    - Keine Abbruchmöglichkeit (kein AbortController o. Ä.).
  - Fehler werden snackbargestützt kommuniziert, aber es gibt:
    - Kein Retry/Backoff.
    - Kein partielles Reconcile (z. B. bereits erfolgreiche Uploads markieren und fehlerhafte zum erneuten Versuch vormerken).

- `removeImage()` triggert einen kompletten Re-Upload-/Re-Lookup-Zyklus. Auf langsamen Verbindungen wirkt die UI dadurch träge und erzeugt unnötigen Traffic.

---

## A11y & UX
- Drag&Drop/Click-Fläche:
  - Gut: Tastaturfokus (`tabindex="0"`), optisches Hovering via `isDragging`.
  - Verbesserung: `keydown` ruft aktuell immer `onAreaClick()` – sollte nur auf Enter/Space reagieren. Außerdem `type="button"` am Button setzen, um Form-Submit zu verhindern.
  - ARIA: Eine `aria-label`/`aria-describedby`-Beschreibung wäre sinnvoll. Live-Announcement beim Start/Ende von Uploads (z. B. für Screenreader).
- Bildliste:
  - `alt="Bild-Vorschau {{ i + 1 }}"` ist okay, kann aber mit Übersetzungs-Keys verbessert werden.
  - Delete-Button sollte ein `aria-label="Bild löschen"` und einen tastaturbedienbaren Fokusstil haben.

---

## Internationalisierung (i18n)
- Texte in der Vorlage verwenden Literalstrings mit dem `translate`-Pipe. Best Practice: Übersetzungs-Keys (z. B. `upload.dropOrClick`) statt literalem deutschen Text, inkl. Einträge in den JSON-Dateien.
- Alt- und Buttontexte ebenso i18n-fähig machen.

---

## Performance & Speicher
- `previews` hält Base64-Daten als JSON-String – das ist einfach, aber speicherintensiv. Bei vielen/ großen Bildern steigt der MemoryFootprint stark an.
- Besser: Trennen von Anzeige-URL (DataURL/Blob-URL) und Upload-Payload (z. B. `File`-Objekt im Speicher oder strukturierte Objekte). Optional Nutzung von `URL.createObjectURL` + Freigabe via `URL.revokeObjectURL`.
- Duplikatvermeidung: Teilweise vorhanden (Check vor `push`), aber globale Konsistenz via Set/Map wäre robuster.

---

## Robustheit & Fehlerbehandlung
- Fehler werden SnackBar-basiert angezeigt – gut.
- Verbesserungen:
  - Upload-Status (isUploading, disabled state), visuelles Feedback, optional Fortschritt (pro Datei).
  - Retry/Backoff-Mechanismus bei Netzfehlern.
  - Bessere Kapselung der Zuordnung URL <-> Media-ID, um teure Lookups zu vermeiden.

---

## Code-Smells / Potenzielle Bugs
1) Asynchroner Bug bei Array.find:
   ```ts
   const matchingExistingImage = this.existingImages.find(
     async (mediaId) => {
       const url = await this.mediaService.getMediaUrl(mediaId)
       return url === image
     },
   )
   ```
   - `Array.prototype.find` erwartet einen synchronen Prädikat-Return (boolean). Das obige Prädikat liefert stets ein Promise, daher wird `matchingExistingImage` fast sicher `undefined`. Ergebnis: Der Fallback funktioniert nicht wie gedacht.
   - Lösung: Entweder vorher eine Map `mediaId -> url` bauen (parallel/lazy), oder synchron arbeiten (alle URLs via `Promise.all` auflösen und dann suchen).

2) Re-Uploads bei `removeImage()`:
   - Nach dem Entfernen wird sofort `uploadImages()` aufgerufen, was alle nicht-HTTP-Einträge erneut verarbeitet. Das kann zu doppelten Uploads führen, wenn vorher schon (anderweitig) hochgeladen wurde oder wenn `uploadImages` mehrfach aufgerufen wird.

3) Keyboard-Handling:
   - `keydown` triggert immer den Dateidialog. Best Practice: Nur Enter (`Enter`) und Space (` `) auswerten.

4) Logging:
   - `console.log`/`console.warn` im Produktionscode; besser über ein Logging-Utility mit Umgebungs-Guard.

5) i18n mit Literalstrings:
   - Sollte auf Keys umgestellt werden.

6) Duplikate/Identität:
   - `track src` ist pragmatisch. Bei JSON-Strings kann Identität durch minimale Formatunterschiede brechen. Eine interne ID (z. B. UUID) wäre stabiler.

---

## Empfohlene Änderungen (kurz, priorisiert)
1) UX/Status:
   - `isUploading` + optional `uploadProgress` einführen; Interaktionen während Upload deaktivieren; sichtbare Ladeanzeige und ARIA-Announcements.

2) Bugfix async find:
   - Entferne den asynchronen `find`-Fallback. Baue stattdessen vorab eine URL-Map:
     - `const urlMap = new Map<RecordId<'media'>, string>(await Promise.all(existingImages.map(async id => [id, await getMediaUrl(id)] as const)))`
     - Dann synchrones Suchen gegen `urlMap`.

3) Upload-Strategie:
   - Deduplizieren und idempotent machen:
     - Trenne Zustand: `existingMediaIds` (vom Server), `newFiles` (lokal, noch nicht hochgeladen), `previewUrls` (nur Anzeige).
     - Nach erfolgreichem Upload: Mappe Preview -> Media-ID, vermeide erneutes Hochladen.
   - Optional: Limitierung paralleler Uploads (z. B. je 3–4 gleichzeitige), Retry mit Backoff.

4) A11y:
   - `keydown` nur Enter/Space, `type="button"`, `aria-label`/`aria-describedby`, Delete-Button mit `aria-label`.

5) i18n:
   - Literaltexte durch Keys ersetzen (auch Alt-/Buttontexte).

6) Performance:
   - Statt Base64-JSON in `previews` strukturierte Daten + Blob-URL für Anzeige; `revokeObjectURL` beim Entfernen.

7) API/Fehler:
   - Besseres Error-Recovery (Teil-Erfolg melden, Retry-Option anbieten).

---

## Optionale Erweiterungen
- Maximalanzahl an Bildern, Sortierung/Neuanordnung (DragSort), Bildkompression/Resizing clientseitig vor Upload, Thumbnail-Generierung.
- Upload-Abbruch via `AbortController` (auch wichtig für Navigation/Cancel).
- Testabdeckung: Unit-Tests für Parser (JSON vs. Fallback), Upload-Flow, Remove-Flow, A11y-Tests.

---
