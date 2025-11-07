-- Analyzer für einfache Volltextsuche
DEFINE ANALYZER OVERWRITE simple_ft TOKENIZERS class FILTERS lowercase, snowball(german);

-- Volltextindizes für Events
DEFINE INDEX OVERWRITE fts_event_name ON TABLE event FIELDS name SEARCH ANALYZER simple_ft BM25;
DEFINE INDEX OVERWRITE fts_event_description ON TABLE event FIELDS description SEARCH ANALYZER simple_ft BM25;

-- Volltextindizes für Organizer
DEFINE INDEX OVERWRITE fts_organizer_name ON TABLE organizer FIELDS name SEARCH ANALYZER simple_ft BM25;

-- Volltextindizes für Location
DEFINE INDEX OVERWRITE fts_location_name ON TABLE location FIELDS name SEARCH ANALYZER simple_ft BM25;
DEFINE INDEX OVERWRITE fts_location_street ON TABLE location FIELDS street SEARCH ANALYZER simple_ft BM25;
DEFINE INDEX OVERWRITE fts_location_city ON TABLE location FIELDS city SEARCH ANALYZER simple_ft BM25;
