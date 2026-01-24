# BSI Fanbase Sentiment Components

React components for displaying and comparing SEC fanbase sentiment data.

## API Base

```
https://bsi-fanbase-sentiment.humphrey-austin20.workers.dev
```

## Components

### FanbaseSelector

Dropdown picker for selecting an SEC school.

```tsx
import { FanbaseSelector } from '@/components/fanbase';

const [schoolId, setSchoolId] = useState<string | null>(null);

<FanbaseSelector value={schoolId} onChange={setSchoolId} placeholder="Pick a school..." />;
```

### FanbaseProfileView

Full profile display with characteristics, rivalries, lexicon, and current mood.

```tsx
import { FanbaseProfileView } from '@/components/fanbase';

<FanbaseProfileView schoolId="texas" />;
```

### RivalryComparison

Side-by-side comparison of two fanbases with metric bars and rivalry detection.

```tsx
import { RivalryComparison } from '@/components/fanbase';

<RivalryComparison initialTeamA="texas" initialTeamB="oklahoma" />;
```

### TriggerAlert

High-intensity trigger alerts for content planning.

```tsx
import { TriggerAlert } from '@/components/fanbase';

<TriggerAlert minIntensity={8} maxTriggers={15} />;
```

## Data Types

Types are exported from `@/lib/fanbase/api-types`:

- `APISchool` - School info
- `APIFanbaseProfile` - Full profile with characteristics
- `APICharacteristic` - Identity/trigger/tradition items
- `APIRivalry` - Rivalry relationship
- `APILexicon` - Fanbase vocabulary terms

## API Endpoints

| Endpoint         | Description                      |
| ---------------- | -------------------------------- |
| `/schools`       | List all 16 SEC schools          |
| `/profile/:id`   | Full fanbase profile             |
| `/sec/triggers`  | All high-intensity triggers (8+) |
| `/compare/:a/:b` | Compare two schools              |
| `/rivalries/:id` | School rivalries                 |
| `/lexicon/:id`   | Fanbase vocabulary               |

## Weekly Updater

The `bsi-fanbase-updater` worker runs every Monday at 6 AM CT to adjust sentiment scores based on recent results.

Deploy: `npx wrangler deploy --config wrangler-updater.toml`

## Design Tokens Used

- `burnt-orange` (#BF5700)
- `texas-soil` (#8B4513)
- `ember` (#FF6B35)
- `charcoal` (#1A1A1A)
- `midnight` (#0D0D0D)
