-- Blog post feed seed data
-- Inserts initial 6 feature articles from Austin Humphrey's writing archive.
-- Uses INSERT OR IGNORE to be safely re-runnable.

INSERT OR IGNORE INTO blog_posts
  (slug, title, subtitle, description, author, category, tags, featured, published, published_at, read_time_mins, word_count, source_context)
VALUES
  (
    'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
    'Texas Baseball Week 1: UC Davis Sweep Recap + Lamar Preview + Michigan State Series',
    NULL,
    'Texas opens 3-0 with a UC Davis sweep. What the numbers actually say, plus a Tuesday matchup preview vs Lamar and a Weekend 2 series look at Michigan State.',
    'Austin Humphrey',
    'editorial',
    '["Texas Longhorns","NCAA Baseball","SEC","Preview","Recap"]',
    1,
    1,
    '2026-02-17',
    6,
    1315,
    'Blaze Sports Intel — Original Editorial (2026)'
  ),
  (
    'cardinals-strategic-intelligence-2025',
    'Cardinals Strategic Intelligence Framework',
    'A systematic analysis of how St. Louis builds competitive advantage',
    'How the Cardinals make decisions, generate competitive advantage, and navigate mid-market constraints through organizational systems and player development discipline.',
    'Austin Humphrey',
    'sports-operations',
    '["St. Louis Cardinals","MLB","Front Office","Player Development","Strategy"]',
    0,
    1,
    '2025-08-01',
    8,
    950,
    'Full Sail University — MAN6224 Sports Management and Operations (2025)'
  ),
  (
    'texas-longhorns-sec-revenue-transformation',
    'Texas Longhorns Revenue Transformation in the SEC Era',
    'The financial case for conference realignment',
    'Texas''s SEC move is a revenue step-change that reshapes the athletic department''s operating model, facilities investment capacity, and competitive ceiling across all sports.',
    'Austin Humphrey',
    'sports-business',
    '["Texas Longhorns","SEC","Conference Realignment","College Athletics","Revenue"]',
    0,
    1,
    '2025-07-15',
    7,
    900,
    'Full Sail University — MAN6224 Sports Management and Operations (2025)'
  ),
  (
    'championship-leadership-nick-saban',
    'Championship Leadership Through Systems: Nick Saban',
    'What Saban built, not what Saban did',
    'Saban''s legacy is demonstrating that systematic organization, cultural architecture, and process discipline can sustain elite performance across decades in the most competitive environment in American sports.',
    'Austin Humphrey',
    'leadership',
    '["Nick Saban","Alabama Football","Leadership","Systems Thinking","Organizational Culture"]',
    0,
    1,
    '2025-06-10',
    9,
    1050,
    'Full Sail University — MAN5100 Executive Leadership II (2025)'
  ),
  (
    'augie-garrido-legacy-of-leadership',
    'Augie Garrido: A Legacy of Leadership',
    'Building something that outlasts any individual',
    'Augie Garrido won 1,975 college baseball games over five decades. The number doesn''t tell the important story — what he built does, and why it kept working long after any single player or staff member moved on.',
    'Austin Humphrey',
    'leadership',
    '["Augie Garrido","Texas Baseball","College Baseball","Coaching","Leadership"]',
    0,
    1,
    '2025-05-20',
    7,
    870,
    'Full Sail University — MAN5100 Executive Leadership II (2025)'
  ),
  (
    'nil-revolution-college-athletics',
    'The NIL Revolution: How Name, Image, and Likeness Reshaped College Athletics',
    'A century-old model meets economic reality',
    'The NIL era is not primarily about athletes making money. It is about a system — the NCAA''s amateur model — that could not withstand contact with economic reality.',
    'Austin Humphrey',
    'sports-business',
    '["NIL","NCAA","College Athletics","Transfer Portal","Sports Law"]',
    0,
    1,
    '2025-04-01',
    10,
    1100,
    'Full Sail University — LSP5100 Legal Issues in Sports (2025)'
  );
