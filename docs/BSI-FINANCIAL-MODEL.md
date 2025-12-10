# Blaze Sports Intel — Financial Model Summary

**Source:** BSI_Financial.xlsx
**Last Updated:** December 2025
**Prepared for:** Internal planning, investor discussions

---

## Company Overview

**Blaze Sports Intel** — A sports intelligence platform focused on college baseball analytics, filling coverage gaps left by ESPN and major sports networks.

**Founder:** Austin Humphrey
**Location:** Boerne, Texas
**Domain:** blazesportsintel.com

---

## Revenue Streams

### 1. BSI Pro Subscription — $29/month
- Target: Individual fans, fantasy players, amateur coaches
- Features: Advanced stats, predictions, API access
- Year 1 projection: 55 → 190 subscribers (peak during baseball season)
- Seasonality: Peaks March–June, dips July–September

### 2. BSI Enterprise Subscription — $199/month
- Target: College programs, scouts, media organizations
- Features: All Pro features + bulk export, custom alerts, priority support
- Year 1 projection: 3 → 10 clients (peak during season)
- 10% commission structure for affiliate referrals

### 3. Advertising & Sponsorship — $1,000/placement
- Target: Sports brands, local businesses, equipment manufacturers
- Year 1 projection: 0 → 3 placements/month (baseball season)
- Primarily in-season revenue

### 4. Data/API Licensing — $5,000/license
- Target: Media companies, other platforms, research institutions
- Year 1 projection: 1 license (April)
- 10% commission for broker referrals
- Cost of goods: 20% (data acquisition, delivery infrastructure)

---

## Cost Structure

### Fixed Monthly Expenses (Year 1)
| Category | Monthly | Annual |
|----------|---------|--------|
| Professional Services | $450 | $5,400 |
| Rent (virtual/coworking) | $1,000 | $12,000 |
| Insurance | $150 | $1,800 |
| Utilities | $100 | $1,200 |
| Telephone/Internet | $150 | $1,800 |
| Office Supplies | $50 | $600 |
| Technology (SaaS, APIs) | $100 | $1,200 |
| **Total Fixed** | **$2,000** | **$24,000** |

### Variable Expenses
- Marketing: Scales with season (peaks March–June)
- Commissions: 10% on Enterprise, 10% on API licensing
- Returns/Allowances: 1% on Pro subscriptions

### Staff Budget (Year 1)
| Role | Months Active | Notes |
|------|---------------|-------|
| CEO/Founder | 12 | Austin (equity compensation initially) |
| Content Director | 5 (Feb–Jun) | Seasonal hire for baseball season |
| Data Analyst | 12 | Full-time analytics support |
| Field Correspondents | 12 | Contract/freelance coverage |

---

## Startup Costs

### Capital Expenditures
| Category | Amount |
|----------|--------|
| Furniture | $1,000 |
| Computers/Software | $3,000 |
| **Subtotal Equipment** | **$4,000** |

### Materials & Supplies
| Category | Amount |
|----------|--------|
| Office Supplies | $500 |
| Business Cards/Stationery | $300 |
| Brochures/Marketing Materials | $500 |
| **Subtotal Materials** | **$1,300** |

### Professional Services & Fees
| Category | Amount |
|----------|--------|
| Initial Rent | $2,000 |
| Deposits (security, utilities) | $500 |
| Licenses & Permits | $500 |
| Professional Memberships | $200 |
| Legal (Attorneys) | $1,500 |
| Accounting Setup | $500 |
| Insurance (initial) | $450 |
| Technical Consultants | $500 |
| Initial Advertising | $1,500 |
| **Subtotal Fees** | **$7,650** |

### Total Startup
| Category | Amount |
|----------|--------|
| Capital Expenditures | $4,000 |
| Materials & Supplies | $1,300 |
| Professional Fees | $7,650 |
| **Total Capital Costs** | **$12,950** |
| Working Capital Reserve | $55,000 |
| **Total Funds Required** | **$67,950** |

---

## Funding Structure

### Source of Funds
| Source | Amount | Notes |
|--------|--------|-------|
| Investor Round (Seed) | $20,000 | Friends/family or angel |
| Principal Investment | $50,000 | Founder contribution |
| **Total Source** | **$70,000** | |

### Use of Funds
| Use | Amount |
|-----|--------|
| Capital Expenditures | $4,000 |
| Working Capital (3-year) | $55,000 |
| Materials & Supplies | $1,300 |
| Professional Services | $7,650 |
| Cash Reserve | $2,050 |
| **Total Use** | **$70,000** |

---

## Marketing Budget (Year 1)

### Monthly Allocation
| Category | Jan | Peak (Apr-Jun) | Off-season |
|----------|-----|----------------|------------|
| Marketing/PR | $150 | $360-390 | $150 |
| Media (TV/Radio/Podcast) | $250 | $600-650 | $250 |
| Website/Digital | $100 | $240-260 | $100 |
| Informal Marketing | $65 | $150-163 | $63 |
| **Monthly Total** | ~$565 | ~$1,350-1,463 | ~$563 |

**Year 1 Marketing Budget:** ~$10,000

---

## Key Financial Assumptions

1. **Seasonality:** Baseball season (Feb–Jun) drives 60%+ of annual revenue
2. **Subscriber Growth:** 15-20% month-over-month during season, flat off-season
3. **Churn:** 1% monthly (Pro), 0% (Enterprise — annual contracts)
4. **COGS:** 3.3% (Pro), 2% (Enterprise), 20% (API Licensing)
5. **Commission Structure:** 0% Pro, 10% Enterprise, 10% API
6. **Working Capital:** 2 months operating expenses as buffer

---

## Three-Year Outlook

### Revenue Growth Targets
| Year | Pro Subs | Enterprise | Ad/Sponsor | API License | Total |
|------|----------|------------|------------|-------------|-------|
| Y1 | ~$45K | ~$15K | ~$12K | ~$5K | ~$77K |
| Y2 | ~$90K | ~$40K | ~$30K | ~$20K | ~$180K |
| Y3 | ~$150K | ~$80K | ~$50K | ~$40K | ~$320K |

### Break-even Analysis
- Monthly burn rate (Year 1): ~$3,000-5,000
- Break-even subscribers: ~180 Pro OR ~25 Enterprise
- Expected break-even: Q2 Year 2

---

## Stripe Integration (Live)

### Configured Price IDs
| Plan | Price ID | Amount |
|------|----------|--------|
| Pro Monthly | `price_1SX9voLvpRBk20R2pW0AjUIv` | $29/mo |
| Enterprise Monthly | `price_1SX9w7LvpRBk20R2DJkKAH3y` | $199/mo |

### Infrastructure
- Checkout: `/api/stripe/create-embedded-checkout`
- Webhooks: `/api/stripe/webhook` (subscription lifecycle)
- Customer Portal: `/api/stripe/portal-session`
- Database: D1 `subscriptions` and `payments` tables

---

## Notes for Development

1. **Feature Gating:** Implement tier checks using `users.tier` column (free/pro/enterprise)
2. **API Rate Limits:** Pro = 1000 req/day, Enterprise = unlimited
3. **Data Export:** Enterprise only
4. **Custom Alerts:** Enterprise only
5. **Priority Support:** Enterprise SLA = 4hr response

---

*This document should be updated quarterly with actual vs. projected metrics.*
