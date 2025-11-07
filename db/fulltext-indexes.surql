-- Analyzer für einfache Volltextsuche
DEFINE ANALYZER simple_ft TOKENIZERS class FILTERS lowercase, ascii;

-- Volltextindizes für Events
DEFINE INDEX fts_event_name ON TABLE event FIELDS name FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;
DEFINE INDEX fts_event_description ON TABLE event FIELDS description FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;

-- Volltextindizes für Organizer
DEFINE INDEX fts_organizer_name ON TABLE organizer FIELDS name FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;

-- Volltextindizes für Location
DEFINE INDEX fts_location_name ON TABLE location FIELDS name FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;
DEFINE INDEX fts_location_street ON TABLE location FIELDS street FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;
DEFINE INDEX fts_location_city ON TABLE location FIELDS city FULLTEXT ANALYZER simple_ft HIGHLIGHTS BM25;
