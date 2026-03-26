---
name: warn-no-hardcode-sports
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: workers/.*\.(ts|js)$
  - field: new_text
    operator: regex_match
    pattern: (score|runs?|hits?|errors?)\s*[:=]\s*\d{1,2}[,\s]|(Yankees|Dodgers|Cardinals|Longhorns|Aggies|Tigers|Crimson Tide|Bulldogs|Volunteers|Razorbacks|Red Raiders|Horned Frogs|Bears|Wildcats|Sooners|Cowboys|Cyclones|Jayhawks|Mountaineers|Sun Devils|Beavers|Ducks|Trojans|Bruins|Huskies|Cougars)\b
---

**Hardcoded sports data detected in worker code.** BSI fetches all data dynamically — never hardcode team names, player names, scores, or standings.

If this is test data or a comment, ignore this warning. Otherwise:
- Pull team names from the API or database
- Pull scores from live data feeds
- Pull player info from roster endpoints

Data philosophy: if it comes from an API, it gets fetched from an API.
