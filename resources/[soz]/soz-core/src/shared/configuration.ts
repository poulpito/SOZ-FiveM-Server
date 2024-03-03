export type JobTaxTier = {
    Tier1: number;
    Tier2: number;
    Tier3: number;
    Tier4: number;
};

export type Configuration = {
    JobTaxTier: JobTaxTier;
};

export const DEFAULT_CONFIGURATION: Configuration = {
    JobTaxTier: {
        Tier1: 1_000_000,
        Tier2: 2_000_000,
        Tier3: 4_000_000,
        Tier4: 5_000_000,
    },
};
