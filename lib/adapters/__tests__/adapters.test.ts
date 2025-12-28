import { describe, it, expect } from 'vitest';
import ESPNUnifiedAdapter from '../espn-unified-adapter';
import BalldontlieAdapter from '../balldontlie-adapter';
import NCAAEnhancedAdapter from '../ncaa-enhanced-adapter';
import { EnhancedProviderManager } from '../enhanced-provider-manager';

describe('Data adapters', () => {
  it('instantiates ESPNUnifiedAdapter', () => {
    const adapter = new ESPNUnifiedAdapter();
    expect(adapter).toBeDefined();
  });

  it('instantiates BalldontlieAdapter', () => {
    const adapter = new BalldontlieAdapter('', undefined);
    expect(adapter).toBeDefined();
  });

  it('instantiates NCAAEnhancedAdapter', () => {
    const adapter = new NCAAEnhancedAdapter({ baseUrl: '', kv: undefined, apiKey: '' });
    expect(adapter).toBeDefined();
  });

  it('instantiates EnhancedProviderManager', () => {
    const manager = new EnhancedProviderManager({});
    expect(manager).toBeDefined();
  });
});
