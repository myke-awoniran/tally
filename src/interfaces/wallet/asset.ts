export enum ActivityStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export interface Asset {
    id: string;
    symbol: string;
    assetType: string;
    user: string;
    network: string;// for system that support multiple blockchain networks
    depositActivity: ActivityStatus;
    withdrawalActivity: ActivityStatus;
    availableBalance: number,
}