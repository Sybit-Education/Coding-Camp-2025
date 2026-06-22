DEFINE ANALYZER OVERWRITE autocomplete_de
    TOKENIZERS blank, class
    FILTERS lowercase, ascii, edgengram(2,20);

DEFINE ANALYZER OVERWRITE stemming_de
    TOKENIZERS blank, class, punct
    FILTERS lowercase, ascii, snowball(german);

DEFINE INDEX OVERWRITE idx_event_name
    ON event COLUMNS name
    FULLTEXT ANALYZER autocomplete_de BM25 HIGHLIGHTS;

DEFINE INDEX OVERWRITE idx_event_desc
    ON event COLUMNS description
    FULLTEXT ANALYZER stemming_de BM25 HIGHLIGHTS;

DEFINE INDEX OVERWRITE idx_event_restriction
    ON event COLUMNS restriction
    FULLTEXT ANALYZER stemming_de BM25;

DEFINE INDEX OVERWRITE idx_event_more_infos_link
    ON event COLUMNS more_infos_link
    FULLTEXT ANALYZER stemming_de BM25;

DEFINE INDEX OVERWRITE idx_topic_name
    ON event COLUMNS topic.name
    FULLTEXT ANALYZER autocomplete_de BM25;
