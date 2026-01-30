export const config = {
    mongodb: {
        uri: <string>process.env.MONGODB_URI,
        collections: {
            assets: 'assets',
            transactions: 'transactions',
            ledgers: 'ledgers',
            deposits: 'deposits',
            withdrawals: 'withdrawals',
        }
    },
    port: process.env.PORT as unknown as number,
    timeZone: process.env.SERVER_TIME_ZONE as unknown as string,
};