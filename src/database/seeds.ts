import {AssetDb, UserAssetDb, UserDb} from "./schemas";
import {ActivityStatus, AssetSymbol, AssetType} from "../interfaces";

export async function seedDefaults() {
    try {
        const gbpAsset = await AssetDb.findOneAndUpdate({
            symbol: AssetSymbol.GBP,
            assetType: AssetType.POUND
        }, {symbol: AssetSymbol.GBP, assetType: AssetType.POUND}, {
            upsert: true
        });

        const user1 = await UserDb.findOneAndUpdate({
                email: 'user1@email.com',
            },
            {
                email: 'user1@email.com',
                firstName: 'user1',
                lastName: 'user1',
                phone: '1234567890'
            }, {
                upsert: true,
            },);

        const user2 = await UserDb.findOneAndUpdate({
            email: "user2@email.com"
        }, {
            email: 'user2@email.com',
            firstName: "user2",
            lastName: "user2",
            phone: '0987654321'
        }, {upsert: true})

        const user1GbpAsset = await UserAssetDb.findOneAndUpdate({user: user1?.id}, {
            asset: gbpAsset?.id, // upserting if not found
            user: user1?.id,
            email: user1?.email,
            availableBalance: 2000000,
            pendingBalance: 0,
            withdrawalActivity: ActivityStatus.ACTIVE,
            DepositActivity: ActivityStatus.ACTIVE
        }, {
            upsert: true,
            new: true
        })

        const user2GbpAsset = await UserAssetDb.findOneAndUpdate({user: user2?.id}, {
            asset: gbpAsset?.id,
            user: user2?.id,
            email: user2?.email,
            availableBalance: 1000000,
            pendingBalance: 0,
            withdrawalActivity: ActivityStatus.ACTIVE,
            DepositActivity: ActivityStatus.ACTIVE
        }, {upsert: true, new: true})
        console.log(user1GbpAsset, user2GbpAsset);
    } catch (error: unknown) {
        throw error;
    }
}
