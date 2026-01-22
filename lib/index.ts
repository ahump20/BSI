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
  createAPIResponse,
  createSuccessResponse,
  createUnavailableResponse,
  createInvalidResponse,
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
  validatedRead,
  toResponse,
} from './validated-read';
