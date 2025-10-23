export interface BranchUniqueProperty {
  key: string;
  title: string;
  description: string;
  status: string;
  evidence?: string;
}

export interface BranchUpgrade {
  key: string;
  title: string;
  description: string;
  status: string;
  stage: string;
  eta?: string;
  priority: number;
}

export interface BranchInsightsOptions {
  includeExperimental?: boolean;
}

export interface BranchInsightsPayload {
  branch: string;
  normalizedBranch: string;
  summary?: string;
  uniqueProperties: BranchUniqueProperty[];
  upgrades: BranchUpgrade[];
  lastUpdated: string;
  generatedAt: string;
  experimentalIncluded: boolean;
}

export const branchInsightsConfig: {
  sharedUniqueProperties: BranchUniqueProperty[];
  sharedUpgrades: BranchUpgrade[];
  branchOverrides: Record<string, {
    summary?: string;
    uniqueProperties?: BranchUniqueProperty[];
    upgrades?: BranchUpgrade[];
  }>;
  defaults: {
    branch: string;
    includeExperimentalBranches: string[];
  };
};

export function getBranchInsights(branchName: string, options?: BranchInsightsOptions): BranchInsightsPayload;
export default branchInsightsConfig;
