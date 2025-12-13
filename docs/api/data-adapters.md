# Data Adapters

This document describes the data adapters integrated into Blaze Sports Intel for ingesting real-time sports feeds and routing them into the Analytics Hub.

## ESPNUnifiedAdapter
The `ESPNUnifiedAdapter` wraps ESPN's public APIs and hidden endpoints. It exposes methods to fetch scoreboard data, team details, and athlete profiles across supported sports. The adapter normalizes the responses and handles pagination, rate limiting, and API keys.

## BalldontlieAdapter
The `BalldontlieAdapter` interfaces with the Balldontlie API, covering multiple sports leagues. It abstracts away provider-specific quirks and returns unified game and player objects that comply with the Blaze Sports Intel data model.

## NCAAEnhancedAdapter
The `NCAAEnhancedAdapter` uses the henrygd/ncaa-api pattern to stream live scores, stats, and play-by-play for NCAA sports. It supports conference filtering and leverages Cloudflare Durable Objects for real-time delivery.

## EnhancedProviderManager
The `EnhancedProviderManager` orchestrates multiple adapters with a circuit breaker, rate limiting, and failover logic. It routes real-time feeds from the ESPN, Balldontlie, and NCAA adapters into the Analytics Hub, ensuring that downstream systems always receive the best available data. The manager prioritizes providers based on quality and falls back when providers are unavailable.

### Real-Time Feed Integration
With these adapters and the provider manager, Blaze Sports Intel can ingest real-time scores, game states, and statistics and push them into the Analytics Hub for analytics and visualization. The Analytics Hub subscribes to the provider manager, receiving normalized events for ingestion, predictive modeling, and display in dashboards.
