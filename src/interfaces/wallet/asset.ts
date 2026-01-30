export enum ActivityStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export interface Asset {
    _id?: string;
    id: string;
    symbol: string;
    assetType: string;
    //so you can suspend withdrawal for a given asset, maybe fraud  issue (Had a scenario we did something like this in my fintech experience LOL)
    withdrawalActivity: ActivityStatus;
}

export interface UserAsset {
    _id?: string;
    id: string;
    asset: string; // system generated Asset ID for this user asset
    user: string;
    availableBalance: number;
    pendingBalance: number;
    withdrawalActivity: ActivityStatus;
    // this is user-specific suspension, maybe fraud linked to their acccount of compliance violation(did this at some point in my career in a financial technology)
    depositActivity: ActivityStatus;
}