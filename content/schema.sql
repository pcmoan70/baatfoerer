-- Båtføreprøven — innholdsdatabase (SQLite).
-- Normalisert kilde-database. Eksporteres til statiske JSON-bundles som
-- frontenden (docs/) laster. Bygg på nytt med content/build_db.py.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS question_sources;
DROP TABLE IF EXISTS choices;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS concept_images;
DROP TABLE IF EXISTS concept_sources;
DROP TABLE IF EXISTS learning_goals;
DROP TABLE IF EXISTS concepts;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS syllabus_areas;
DROP TABLE IF EXISTS sources;

-- Kilder (offisielle + private). allowed_use styrer hvordan vi bruker kilden.
CREATE TABLE sources (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  authority   TEXT NOT NULL,         -- official | official_law | ngo | private
  allowed_use TEXT,                  -- metadata | summary_links | links_only | citations_links
  last_checked TEXT
);

-- De fire pensumdelene.
CREATE TABLE syllabus_areas (
  id        TEXT PRIMARY KEY,        -- sjomannskap | lover | navigasjon | spesielt
  title     TEXT NOT NULL,
  ord       INTEGER NOT NULL,
  note      TEXT
);

-- Pensum-underpunkter (1.1a, 1.2b, 1.4.1 …).
CREATE TABLE topics (
  id         TEXT PRIMARY KEY,
  area_id    TEXT NOT NULL REFERENCES syllabus_areas(id),
  title      TEXT NOT NULL,
  pensum_ref TEXT,                   -- f.eks. "1.2 a", "1.4.3"
  ord        INTEGER
);

-- Analyserte fagbilder (fra data/images_analysis.json).
CREATE TABLE images (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  file           TEXT UNIQUE NOT NULL,   -- relativt til data/
  site           TEXT,
  category       TEXT,
  norwegian_term TEXT,
  what_it_shows  TEXT,
  reusable       INTEGER DEFAULT 0,      -- 0 = kun analyse (opphavsrett), 1 = ok
  page_url       TEXT,
  license        TEXT,                   -- f.eks. "CC BY-SA 4.0", "CC0", "Public domain"
  attribution    TEXT,                   -- kreditering (forfatter + lisens + kilde)
  flashcard      INTEGER DEFAULT 1       -- 0 = ekskluder fra «identifiser»-bildekort
);

-- Konsepter (læringsenheter). importance og exam_area styrer adaptiv vekting.
CREATE TABLE concepts (
  id         TEXT PRIMARY KEY,
  area_id    TEXT NOT NULL REFERENCES syllabus_areas(id),
  topic      TEXT,
  title      TEXT NOT NULL,
  importance TEXT DEFAULT 'normal',  -- normal | high | critical
  exam_area  TEXT,                   -- sjomannskap|lover|navigasjon|spesielt_viktige
  summary    TEXT,
  body       TEXT
);

CREATE TABLE learning_goals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL REFERENCES concepts(id),
  goal       TEXT NOT NULL
);

CREATE TABLE concept_sources (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL REFERENCES concepts(id),
  source_id  TEXT REFERENCES sources(id),
  url        TEXT,
  section    TEXT,
  quote      TEXT
);

CREATE TABLE concept_images (
  concept_id TEXT NOT NULL REFERENCES concepts(id),
  image_id   INTEGER NOT NULL REFERENCES images(id),
  role       TEXT,                   -- illustrasjon | symbol | diagram
  PRIMARY KEY (concept_id, image_id)
);

-- Spørsmål (egne formuleringer).
CREATE TABLE questions (
  id          TEXT PRIMARY KEY,
  concept_id  TEXT NOT NULL REFERENCES concepts(id),
  type        TEXT NOT NULL,         -- mcq | bilde_symbol | numeric | scenario | flashcard
  difficulty  INTEGER DEFAULT 1,     -- 1..3
  importance  TEXT DEFAULT 'normal',
  exam_area   TEXT,
  prompt      TEXT NOT NULL,
  explanation TEXT,
  image_id    INTEGER REFERENCES images(id)
);

CREATE TABLE choices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL REFERENCES questions(id),
  ord         INTEGER NOT NULL,
  text        TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE question_sources (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL REFERENCES questions(id),
  source_id   TEXT REFERENCES sources(id),
  url         TEXT,
  section     TEXT,
  quote       TEXT
);

CREATE INDEX idx_concepts_area ON concepts(area_id);
CREATE INDEX idx_questions_concept ON questions(concept_id);
CREATE INDEX idx_choices_question ON choices(question_id);
