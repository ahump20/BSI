# ML Pipeline Service Helpers

This module powers the Blaze Sports Intel production inference stack for pro and NCAA baseball, football, and basketball. The helpers exposed in `ml-pipeline-service.js` are responsible for:

- **Data retrieval** – `getGameOutcomeData`, `getSeasonWinsData`, and `getPlayerPerformanceData` execute parameterized Postgres queries that join the `games`, `team_analytics`, and `player_analytics` tables to hydrate features for MLB/NFL/NBA and their NCAA counterparts.
- **Feature preparation** – `prepareFeatures` and `normalizeFeatures` transform engineered feature vectors into standardized tensors with stored mean/std metadata so inference inputs mirror the training distribution.
- **Model governance** – `makePrediction`, `evaluateModel`, and `saveModel` handle inference, TensorFlow.js metric calculation (including multi-class confusion matrices), and artifact persistence with version metadata.
- **Operational telemetry** – `validateTrainingData`, `updateTrainingRun`, `updateTrainingProgress`, `logPrediction`, `checkRetrainingNeeds`, and `getLastTrainingDate` coordinate training health checks, run-book updates, and prediction logging for downstream monitoring.

Every helper emits structured logs through the injected logger so that failures surface actionable context without exposing PII. Models are serialized to the filesystem under `storage/models/<model_type>/<version>` with normalization parameters persisted alongside the artifact for repeatable inference.
