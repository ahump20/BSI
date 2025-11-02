/**
 * Placeholder WHOOP adapter.
 *
 * The production integration should be implemented with the official WHOOP v2 API.
 * Until secrets are wired up in the deployment environment we return stubbed
 * functions so that static builds succeed without bundling third-party SDKs.
 */

export interface WHOOPAdapterConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export interface WHOOPTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface WHOOPProfile {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface WHOOPAdapter {
  exchangeCodeForTokens(code: string): Promise<WHOOPTokens>;
  getUserProfile(accessToken: string): Promise<WHOOPProfile>;
}

const missingConfigMessage =
  'WHOOP adapter has not been configured. Provide credentials in environment variables before enabling this route.';

export function createWHOOPAdapter(_config: WHOOPAdapterConfig = {}): WHOOPAdapter {
  return {
    async exchangeCodeForTokens(_code: string): Promise<WHOOPTokens> {
      throw new Error(missingConfigMessage);
    },
    async getUserProfile(_accessToken: string): Promise<WHOOPProfile> {
      throw new Error(missingConfigMessage);
    }
  };
}
