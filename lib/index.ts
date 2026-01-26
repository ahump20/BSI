/**
 * BSI Lib - HTTP and Cache Correctness Layer
 * Central exports for HTTP safety, validation, and caching utilities.
 */

// API Contract types and factories
export {
  type LifecycleState,
  type ResponseStatus,
  type CacheMeta,
  type QuotaMeta,
  type ResponseMeta,
  type APIResponse,
  type CreateResponseOptions,
  type ConsumerCompatibility,
  type RenderabilityContract,
  type SchemaAssertionResult,
  createAPIResponse,
  createSuccessResponse,
  createUnavailableResponse,
  createInvalidResponse,
  buildRenderabilityContract,
} from './api-contract';

// Semantic Validation
export {
  type DatasetStatus,
  type SeasonMonths,
  type SemanticRule,
  type ValidationResult,
  SEMANTIC_RULES,
  isWithinSeason,
  getRule,
  validateDataset,
  isValidForCaching,
} from './semantic-validation';

// KV Safety Layer
export {
  type SafeHTTPStatus,
  type KVSafetyMetadata,
  type KVSafeData,
  type LegacyCachedData,
  hasKVSafetyMetadata,
  isLegacyCachedData,
  createKVSafetyMetadata,
  wrapWithSafetyMetadata,
  parseKVValue,
  getAgeSeconds,
  isStale,
} from './kv-safety';

// HTTP Correctness
export {
  type HTTPMappingResult,
  type HTTPMappingInput,
  mapToHTTPStatus,
  determineLifecycleState,
  isCacheEligible,
  buildCacheHeaders,
  buildHeadersFromMapping,
} from './http-correctness';

// Validated Read
export {
  type ValidatedReadResult,
  type ValidatedReadOptions,
  type ValidatedReadVersionedResult,
  type SchemaAssertionInfo,
  validatedRead,
  validatedReadVersioned,
  assertShapeBeforeResponse,
  toResponse,
} from './validated-read';

// Readiness Service
export {
  type ReadinessState,
  type ReadinessRecord,
  type ReadinessCheckResult,
  type LKGStatus,
  checkReadiness,
  transitionReadiness,
  markLiveIngestion,
  validateFromSnapshot,
  getSystemReadiness,
  getScopeReadiness,
  initializeScope,
  isServingLKG,
  markScopeServingLKG,
  clearScopeLKGStatus,
} from './readiness';

// Dataset Commit Boundary System
export {
  type CommitStatus,
  type DatasetCommit,
  type DatasetCurrentVersion,
  buildVersionedKey,
  buildCurrentKey,
  parseSportFromDatasetId,
  getNextVersion,
  getCurrentVersion,
  getCommit,
  getRecentCommits,
  getLastCommittedVersion,
  createPendingCommit,
  promoteCommit,
  rollbackCommit,
  markServingLKG,
  clearLKGStatus,
  getDatasetsServingLKG,
  getAllCurrentVersions,
} from './dataset-commit';

// Dataset Ingestion Pipeline
export {
  type IngestContext,
  type IngestResult,
  ingestDataset,
  promoteVersion,
  markIngestionFailed,
  readCurrentVersion,
} from './dataset-ingest';

// Schema Validation System
export {
  type InvariantRuleType,
  type InvariantRule,
  type SchemaInvariants,
  type DatasetSchema,
  type SchemaErrorReason,
  type FieldViolation,
  type SchemaValidationResult,
  computeSchemaHash,
  getActiveSchema,
  getSchemaByVersion,
  validateAgainstSchema,
  isSchemaCompatible,
  canPromoteToKV,
  createSchema,
  deactivateSchema,
} from './schema-validation';
