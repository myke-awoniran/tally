import mongoose from 'mongoose';
import {TransactionDb, User, AssetDb, LedgerDb, UserAssetDb, DepositDb, WithdrawalDb, Ledger} from "../database";
import {ActivityStatus, AssetType, ClerkType, TransactionStatus, TransactionType} from "../interfaces";
import {v4 as uuidv4} from 'uuid';

interface TransferParams {
    fromAccount: string;
    toAccount: string;
    amount: number;
    assetType: AssetType;
    transferType: TransactionType;
    metadata?: Record<string, any>;
}

// Note, I store the amount in the smallest currency unit (e.g., cents) to avoid floating point issues.
// I know you can use Decimal and all of that, but let me keep things minimal, yunno, this is just a poc.
export class LedgerEngine {

    private static async transfer(params: TransferParams) {
        try {

            if (params.amount <= 0) {
                throw new Error('Amount must be positive');
            }

            if (params.fromAccount === params.toAccount) {
                throw new Error('Cannot initiate transfer to same account');
            }

            if (params.amount < 10000) {
                throw new Error(`Minimum transfer amount is ${params.assetType}100.00`);
            }

            const validAsset = await AssetDb.findOne({assetType: params.assetType});

            if (!validAsset) {
                throw new Error('Invalid system asset')
            } else if (validAsset.withdrawalActivity === ActivityStatus.SUSPENDED) {
                throw new Error('Service not available. Please try again later.')
            }

            const from = await UserAssetDb.findOne({
                user: params.fromAccount,
            });

            if (!from) {
                throw new Error('Invalid user account')
            } else if (from.withdrawalActivity !== ActivityStatus.ACTIVE) {
                throw new Error(`your ${validAsset.symbol} withdrawal activity is suspended. Please contact support. `)
            }

            if (from.availableBalance < params.amount) {
                throw new Error('Insufficient balance');
            }

            const to = await UserAssetDb.findOne({
                user: params.toAccount,
            });

            if (!to) {
                throw new Error('Invalid user account')
            } else if (to.depositActivity !== ActivityStatus.ACTIVE) {
                throw new Error(`Receiver account cannot receive ${validAsset.symbol} deposit activity at this moment.`)
            }


            const session = await mongoose.startSession();

            await session.withTransaction(async () => {
                const txn = new TransactionDb({
                    reference: `myke_poc${uuidv4()}`,
                    user: params.fromAccount,
                    asset: validAsset.id,
                    status: TransactionStatus.SUCCESS, // since it's same system, no waiting for webhook
                    amount: params.amount,
                    fee: 0,
                    totalAmount: params.amount,
                    clerkType: ClerkType.DEBIT,
                    type: TransactionType.WITHDRAWAL,
                    description: params.metadata?.description || 'p2p transfer',
                })

                const depositTxn = new DepositDb({
                    user: params.toAccount,
                    asset: validAsset.id,
                    transaction: txn.id,
                    amount: params.amount,
                    status: TransactionStatus.SUCCESS,
                    reference: txn.reference,
                    metadata: params.metadata
                })
                const withdrawalTxn = new WithdrawalDb({
                    user: params.fromAccount,
                    asset: validAsset.id,
                    transaction: txn.id,
                    amount: params.amount,
                    fee: 0,
                    status: TransactionStatus.SUCCESS,
                    reference: txn.reference,
                    destination: params.toAccount,
                    metadata: params.metadata
                })

                const fromNext = from.availableBalance - params.amount;
                const toNext = to.availableBalance + params.amount;


                const ledgerEntries = new LedgerDb(
                    [
                        {
                            asset: from._id,
                            user: from.user,
                            transaction: txn.id,
                            availableDelta: -params.amount,
                            availableBalance: fromNext,
                            metadata: params.metadata
                        },
                        {
                            asset: to._id,
                            user: to.user,
                            transaction: txn.id,
                            availableDelta: params.amount,
                            availableBalance: toNext,
                            metadata: params.metadata
                        }
                    ],
                );
                // do not use promise.all
                await txn.save({session});
                await withdrawalTxn.save({session});
                await depositTxn.save({session});
                await ledgerEntries.save({session});

                await UserAssetDb.updateOne(
                    {_id: from.id},
                    {$set: {availableBalance: fromNext}}
                ).session(session);

                await UserAssetDb.updateOne(
                    {_id: to.id},
                    {$set: {availableBalance: toNext}}
                ).session(session);
            });

            session.endSession();
        } catch (error: unknown) {
            throw error;
        }
    }


    static async replay() {
        const ledgers: Ledger[] = await LedgerDb.find().sort({createdAt: 1});

        const balances = new Map<string, number>();

        for (const l of ledgers) {
            const prev = balances.get(l.user) ?? 0;
            balances.set(l.user, prev + l.availableDelta);
        }

        for (const [assetId, balance] of balances.entries()) {
            await UserAssetDb.updateOne(
                {_id: assetId},
                {$set: {availableBalance: balance}}
            );
        }

        return balances;
    }


    static async auditAccount(accountId: string) {
        return LedgerDb.find({asset: accountId}).sort({createdAt: 1});
    }


    static async auditTransaction(transactionId: string) {
        return LedgerDb.find({transaction: transactionId}).sort({createdAt: 1});
    }

    /**
     * Global invariant validation.
     */
    static async validateLedger() {
        const agg = await LedgerDb.aggregate([
            {
                $group: {
                    _id: null,
                    total: {$sum: '$availableDelta'}
                }
            }
        ]);

        const total = agg[0]?.total ?? 0;

        if (total !== 0) {
            throw new Error(`Ledger invariant violated: ${total}`);
        }

        return true;
    }


    static async withdraw(params: {
        userAccount: string;
        systemAccount: string;
        amount: number;
        transactionId: string;
    }) {
        return this.transfer({
            fromAccount: params.userAccount,
            toAccount: params.systemAccount,
            amount: params.amount,
            assetType: AssetType.POUND,
            transferType: TransactionType.WITHDRAWAL,
        });
    }


}
