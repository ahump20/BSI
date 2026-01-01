# Twitter/X API Developer Application

Use this template when applying for Twitter API access at https://developer.x.com

---

## Application Details

### Use Case Category
**Academic Research** or **Hobbyist/Personal Use**

### Project Name
**Blaze Sports Intel - College Baseball Transfer Portal Tracker**

### Use Case Description (500+ characters required)

```
Blaze Sports Intel is a college baseball analytics platform that tracks transfer portal
movements in real-time. Our application monitors announcements from trusted college
baseball journalists (Kendall Rogers, D1Baseball, Baseball America) to aggregate
transfer portal entries into a centralized database.

The data enables:
1. Real-time alerts for fans and coaches about portal movements
2. Historical analysis of transfer patterns by conference and position
3. Player research tools for recruiting coordinators

We use the Search API to find tweets mentioning "transfer portal" and "entered the portal"
from a curated list of 6-10 verified college baseball reporters. We process approximately
10-50 tweets per hour during portal season (May-June), with minimal activity off-season.

All data is displayed with proper attribution to original tweet authors. We do not
republish tweet content verbatim—only extract structured player/school/position data.
We respect rate limits and implement intelligent polling to minimize API calls.

Our platform serves the underserved college baseball community that receives minimal
coverage from major sports networks.
```

### Will you display tweets and/or Twitter content?
**No** - We extract structured data only (player names, schools) and link back to original tweets.

### Will your product, service, or analysis make Twitter content available to a government entity?
**No**

### Do you plan to analyze Tweets?
**Yes** - We parse tweet text to extract:
- Player names
- School names (transferring from)
- Destination schools (if announced)
- Position (RHP, LHP, C, INF, OF, etc.)
- Conference affiliation

### How will you use this data?
- Display aggregated portal entries on blazesportsintel.com
- Send push notifications to subscribed users
- Generate statistical reports on portal trends

---

## Technical Details

### API Endpoints Used
- `GET /2/tweets/search/recent` (Search Tweets)

### Estimated Volume
- **Reads per month:** 2,000-5,000 (well under 15K Basic tier limit)
- **Peak usage:** Portal season (May-June), ~100-200 reads/day
- **Off-season:** Minimal, ~10-20 reads/day

### Rate Limiting Strategy
- Batch queries: Search multiple accounts in single request using `(from:user1 OR from:user2)`
- Intelligent polling: 10-minute intervals during peak, 4-hour intervals off-season
- Local caching: Store `since_id` to avoid re-fetching seen tweets
- Monthly budget tracking: Hard stop at 80% of limit

---

## Sample Query

```
(from:kendallrogersD1 OR from:d1baseball OR from:BaseballAmerica)
("transfer portal" OR "entered the portal" OR "in the portal")
baseball
-is:retweet
lang:en
```

---

## Contact Information

**Name:** Austin Humphrey
**Email:** austin@blazesportsintel.com
**Website:** https://blazesportsintel.com
**Company:** Blaze Sports Intel LLC
**Location:** Boerne, Texas, USA

---

## Tips for Approval

1. **Be specific about your use case** - Vague applications get rejected
2. **Emphasize you're not republishing content** - Twitter cares about this
3. **Show you understand rate limits** - Mention your batching strategy
4. **Academic/research framing helps** - Sports analytics is research
5. **Start with Basic tier** - $200/mo, 15K reads, usually approved quickly
6. **Expect 1-3 day review** - Weekend applications may take longer

---

## After Approval

1. Create a new App in the Developer Portal
2. Generate Bearer Token (OAuth 2.0 App-Only)
3. Add to your environment:
   ```bash
   export TWITTER_BEARER_TOKEN="your_bearer_token_here"
   ```
4. Run test: `npm run test` in bsi-agent directory
