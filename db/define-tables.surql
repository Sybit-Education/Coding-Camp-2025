DEFINE TABLE OVERWRITE event TYPE NORMAL SCHEMAFULL
PERMISSIONS
        FOR create, select, update FULL,
        FOR delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON event;
DEFINE FIELD OVERWRITE name ON event TYPE string;
DEFINE FIELD OVERWRITE date_end ON event TYPE option<datetime>;
DEFINE FIELD OVERWRITE date_start ON event TYPE datetime;
DEFINE FIELD OVERWRITE description ON event TYPE option<string>;
DEFINE FIELD OVERWRITE more_infos_link ON event TYPE option<string>;
DEFINE FIELD OVERWRITE price ON event TYPE option<decimal>;
DEFINE FIELD OVERWRITE age ON event TYPE option<int>;
DEFINE FIELD OVERWRITE restriction ON event TYPE option<string>;
DEFINE FIELD OVERWRITE draft ON event TYPE option<bool>;


DEFINE FIELD OVERWRITE organizer ON event TYPE record<organizer>;
DEFINE FIELD OVERWRITE event_type ON event TYPE option<record<event_type>>;
DEFINE FIELD OVERWRITE location ON event TYPE option<record<location>>;
DEFINE FIELD OVERWRITE topic ON event TYPE option<array<record<topic>>>;
DEFINE FIELD OVERWRITE media ON event TYPE option<array<record<media>>>;


DEFINE TABLE OVERWRITE topic TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR create, select FULL,
        FOR update, delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON topic;
DEFINE FIELD OVERWRITE name ON topic TYPE string;
DEFINE FIELD OVERWRITE color ON topic TYPE string;
DEFINE FIELD OVERWRITE description ON topic TYPE option<string>;
DEFINE FIELD OVERWRITE media ON topic TYPE option<record<media>>;


DEFINE TABLE OVERWRITE organizer TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR create, select FULL,
        FOR update, delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON organizer;
DEFINE FIELD OVERWRITE name ON organizer TYPE string;
DEFINE FIELD OVERWRITE email ON organizer TYPE option<string>;
DEFINE FIELD OVERWRITE phonenumber ON organizer TYPE option<string>;


DEFINE TABLE OVERWRITE event_type TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR create, select FULL,
        FOR update, delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON event_type;
DEFINE FIELD OVERWRITE name ON event_type TYPE string;
DEFINE FIELD OVERWRITE description ON event_type TYPE option<string>;
DEFINE FIELD OVERWRITE media ON event_type TYPE option<record<media>>;


DEFINE TABLE OVERWRITE location TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR create, select FULL,
        FOR update, delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON location;
DEFINE FIELD OVERWRITE name ON location TYPE string;
DEFINE FIELD OVERWRITE street ON location TYPE option<string>;
DEFINE FIELD OVERWRITE city ON location TYPE option<string> DEFAULT Radolfzell;
DEFINE FIELD OVERWRITE zip_code ON TABLE location TYPE option<string>;
DEFINE FIELD OVERWRITE geo_point ON location TYPE option<point>;
DEFINE FIELD OVERWRITE media ON location TYPE option<array<record<media>>>;


DEFINE TABLE OVERWRITE media TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR create, select FULL,
        FOR update, delete WHERE $auth != NONE;
DEFINE FIELD OVERWRITE id ON media;
DEFINE FIELD OVERWRITE file ON media TYPE option<string>;
DEFINE FIELD OVERWRITE fileName ON media TYPE option<string>;
DEFINE FIELD OVERWRITE fileType ON media TYPE option<string>;


DEFINE TABLE OVERWRITE user TYPE NORMAL SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $auth == id,
        FOR create, update, delete NONE;
DEFINE FIELD OVERWRITE id ON user;
DEFINE FIELD OVERWRITE name ON user TYPE string;
DEFINE FIELD OVERWRITE password ON user TYPE string VALUE crypto::argon2::generate($value);
DEFINE INDEX OVERWRITE name ON user FIELDS name UNIQUE;



DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD SIGNIN (
  SELECT * FROM user WHERE name = $username AND crypto::argon2::compare(password, $password) )
  DURATION FOR TOKEN 48h, FOR SESSION 48h
;



DEFINE FUNCTION OVERWRITE fn::normalize($name: string, $seperator: option<string>) {
    LET $result = $name.lowercase().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").slug();
    IF ($seperator != NONE && $seperator != "-") {
        RETURN string::replace($result, "-", $seperator);
    };
    RETURN $result;
};