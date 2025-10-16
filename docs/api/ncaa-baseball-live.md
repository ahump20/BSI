# NCAA Baseball Live Stream API

## Overview

The NCAA Baseball Live Stream endpoint exposes the real-time feed that powers Diamond Insights game centers. It consumes the LiveStats ingestion queue, normalizes events into inning-level snapshots, and returns the most recent base-state and win expectancy information for a given game.

- **Endpoint:** `GET /api/live/ncaa/baseball`
- **Auth:** Public (rate limited via Cloudflare)
- **Cache:** Edge disabled (`Cache-Control: no-store`). Each game frame is retained in `SPORTS_CACHE`/Redis for ~2 seconds so clients can fast-resume.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameId`  | string | ✅ | NCAA game identifier from the LiveStats reader. |
| `sequence` | number | Optional | Last sequence number the client processed. Pass this to resume without replaying older frames. |

## Response Structure

```
{
  "success": true,
  "sport": "ncaa-baseball",
  "gameId": "401573165",
  "sequence": 109872,
  "nextSequence": 109872,
  "frames": [
    {
      "sequence": 109872,
      "timestamp": "2025-03-15T21:07:44.102Z",
      "inning": 7,
      "half": "top",
      "outs": 2,
      "bases": { "first": true, "second": false, "third": false },
      "count": { "balls": 2, "strikes": 2, "pitches": 5 },
      "score": { "home": 3, "away": 4 },
      "event": {
        "type": "plateAppearance",
        "description": "T. Johnson singles on a ground ball to left fielder.",
        "batter": "T. Johnson",
        "pitcher": "R. Smith",
        "result": "single"
      },
      "winExpectancy": {
        "home": 0.42,
        "away": 0.58,
        "delta": -0.03,
        "source": "BSI-LiveStats"
      }
    }
  ],
  "innings": [
    {
      "inning": 7,
      "half": "top",
      "startSequence": 109820,
      "endSequence": 109872,
      "events": [
        {
          "sequence": 109872,
          "timestamp": "2025-03-15T21:07:44.102Z",
          "summary": "T. Johnson singles on a ground ball to left fielder.",
          "outs": 2,
          "bases": { "first": true, "second": false, "third": false },
          "score": { "home": 3, "away": 4 },
          "winExpectancy": { "home": 0.42, "away": 0.58, "delta": -0.03, "source": "BSI-LiveStats" }
        }
      ]
    }
  ],
  "meta": {
    "dataSource": "BSI LiveStats Ingest",
    "lastUpdated": "2025-03-15T21:07:44.102Z",
    "delivered": 1,
    "cacheHit": false
  }
}
```

### Notes

- `sequence` / `nextSequence` mirror the ingestion queue sequence number. The client should store `nextSequence` and send it back as `sequence` on the next poll.
- When no new frames are available, the API returns the cached latest frame (if newer than the provided `sequence`) with `cacheHit: true` so UIs can avoid flicker.
- Win expectancy values are normalized to decimals (`0.00 – 1.00`). `delta` reflects the change from the prior frame (or the queue-provided baseline when resuming).
- Base state flags follow the standard diamond order (`first`, `second`, `third`).
- TTL in `SPORTS_CACHE` is ~2 seconds to ensure resumed clients never fall more than a single pitch behind while keeping storage pressure minimal.

## WebSocket Channel

The WebSocket broadcaster now exposes a dedicated channel named `ncaa-baseball`. Clients can send:

```
{"type":"subscribeChannel","channel":"ncaa-baseball"}
```

to receive the same frames pushed in real time without polling.

