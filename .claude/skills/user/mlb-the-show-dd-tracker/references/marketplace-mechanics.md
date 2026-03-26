# Marketplace Mechanics & Price Analysis

## Market Structure

The Show's DD marketplace is a double-auction order book. Buyers post buy orders (bids), sellers post sell orders (asks). Transactions execute when a bid meets or exceeds an ask.

- **Best Buy Price**: Highest active bid — what a seller gets by selling now
- **Best Sell Price**: Lowest active ask — what a buyer pays to buy now
- **Spread**: best_sell_price - best_buy_price (always >= 0 for listed cards)
- **Completed Orders**: Historical transactions with timestamps and prices

## Price Signals

### Spread Analysis

| Spread | Signal |
|--------|--------|
| < 5% of card value | Liquid, consensus on price |
| 5-15% | Normal market, some disagreement |
| 15-30% | Thin liquidity, volatile |
| > 30% | Dead market or major event pending (content drop, roster update) |

### Velocity

Track completed orders per time window. High velocity + tightening spread = price is stabilizing. High velocity + widening spread = price is in motion.

### Content Drop Patterns

- **New card series release**: Existing cards in same position often drop 10-30% as supply shifts
- **Roster updates (Live Series)**: Cards that get OVR upgrades spike, downgrades tank
- **Flash sales / packs**: Flood supply, compress prices temporarily
- **Collection rewards announced**: Required cards for new collections spike

## Flip Detection

A flip opportunity exists when:
```
potential_profit = best_buy_price - best_sell_price - tax
tax = floor(best_buy_price * 0.10)  // 10% sell tax
```

If `potential_profit > 0`, the flip is mathematically viable. Viability != actionability — velocity and spread stability matter.

### Flip Quality Tiers

| Tier | Criteria |
|------|----------|
| Strong | profit > 1000 stubs AND spread < 15% AND velocity > 5/hr |
| Moderate | profit > 500 stubs AND spread < 25% |
| Marginal | profit > 200 stubs, any spread |
| Avoid | profit < 200 or spread > 40% |

## Watchlist Logic

Users add cards to a personal watchlist. The watchlist tracks:
- Price at time of add
- Current price
- Price delta (absolute + percentage)
- Alert thresholds (user-set buy/sell targets)

Watchlist data lives in D1 `show_dd_watchlist` table, scoped per user session or anonymous ID.

## Collection Tracking

Collections group required cards. Progress = cards_owned / cards_required. Collection completion unlocks rewards.

Track per collection:
- Total cards required
- Cards the user has marked as owned
- Estimated stub cost to complete (sum of best_buy_price for unowned cards)
- Price trend of remaining cards (are they getting cheaper or more expensive?)

## Data Freshness

| Data Type | Sync Frequency | Stale After |
|-----------|---------------|-------------|
| Listings (buy/sell prices) | Every 15 min | 30 min |
| Items (card catalog) | Every 6 hours | 24 hours |
| Captains | Every 6 hours | 24 hours |
| Price history | Daily rollup | 48 hours |
| Meta data | Daily | 7 days |

Surface freshness timestamps in every API response and UI data surface.
