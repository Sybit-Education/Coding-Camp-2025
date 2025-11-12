-- Optimaler Setup für deutsche Volltextsuche
DEFINE ANALYZER OVERWRITE autocomplete_de 
    TOKENIZERS blank, class 
    FILTERS lowercase, ascii, edgengram(2,10);

DEFINE ANALYZER OVERWRITE stemming_de 
    TOKENIZERS blank, class, punct 
    FILTERS lowercase, ascii, snowball(german);

-- Event
DEFINE INDEX OVERWRITE idx_event_name 
    ON event FIELDS name 
    SEARCH ANALYZER autocomplete_de BM25(1.2, 0.75) HIGHLIGHTS;

DEFINE INDEX OVERWRITE idx_event_desc 
    ON event FIELDS description 
    SEARCH ANALYZER stemming_de BM25(1.2, 0.75) HIGHLIGHTS;

DEFINE INDEX OVERWRITE idx_event_restriction 
    ON event FIELDS restriction 
    SEARCH ANALYZER stemming_de BM25;

DEFINE INDEX OVERWRITE idx_event_more_infos_link 
    ON event FIELDS more_infos_link 
    SEARCH ANALYZER stemming_de BM25;

-- Location
DEFINE INDEX OVERWRITE idx_location_name 
    ON event FIELDS location.name 
    SEARCH ANALYZER autocomplete_de BM25(1.2, 0.75) HIGHLIGHTS;

DEFINE INDEX OVERWRITE fts_location_street 
    ON TABLE event FIELDS location.street 
    SEARCH ANALYZER autocomplete_de BM25(1.2, 0.75) HIGHLIGHTS;

DEFINE INDEX OVERWRITE fts_location_street 
    ON TABLE event FIELDS location.city 
    SEARCH ANALYZER autocomplete_de BM25(1.2, 0.75) HIGHLIGHTS;

-- Organizer
DEFINE INDEX OVERWRITE fts_organizer_name 
    ON event FIELDS organizer.name 
    SEARCH ANALYZER autocomplete_de BM25(1.2, 0.75) HIGHLIGHTS;

-- Event Type
DEFINE INDEX OVERWRITE idx_eventtype_name 
    ON event FIELDS event_type.name 
    SEARCH ANALYZER autocomplete_de BM25;

DEFINE INDEX OVERWRITE idx_eventtype_description 
    ON event FIELDS event_type.description 
    SEARCH ANALYZER stemming_de BM25;

-- Topic (bei Bedarf)
DEFINE INDEX OVERWRITE idx_topic_name 
    ON event FIELDS topic.name 
    SEARCH ANALYZER autocomplete_de BM25;
