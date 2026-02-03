import mongoose from "mongoose";
import {
  TransactionDb,
  User,
  AssetDb,
  LedgerDb,
  UserAssetDb,
  DepositDb,
  WithdrawalDb,
  Ledger,
} from "../database";
import {
  ActivityStatus,
  AssetType,
  ClerkType,
  TransactionStatus,
  TransactionType,
} from "../interfaces";
import { v4 as uuidv4 } from "uuid";

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
        throw new Error("Amount must be positive");
      }

      if (params.fromAccount === params.toAccount) {
        throw new Error("Cannot initiate transfer to same account");
      }

      if (params.amount < 10000) {
        throw new Error(`Minimum transfer amount is ${params.assetType}100.00`);
      }

      const validAsset = await AssetDb.findOne({ assetType: params.assetType });

      if (!validAsset) {
        throw new Error("Invalid system asset");
      } else if (validAsset.withdrawalActivity === ActivityStatus.SUSPENDED) {
        throw new Error("Service not available. Please try again later.");
      }

            const from = await UserAssetDb.findOne({
                email: params.fromAccount,
                asset: validAsset.id
            });

      if (!from) {
        throw new Error("Invalid user account");
      } else if (from.withdrawalActivity !== ActivityStatus.ACTIVE) {
        throw new Error(
          `your ${validAsset.symbol} withdrawal activity is suspended. Please contact support. `,
        );
      }

      if (from.availableBalance < params.amount) {
        throw new Error("Insufficient balance");
      }

            const to = await UserAssetDb.findOne({
                email: params.toAccount,
                asset: validAsset.id
            });

      if (!to) {
        throw new Error("Invalid user account");
      } else if (to.depositActivity !== ActivityStatus.ACTIVE) {
        throw new Error(
          `Receiver account cannot receive ${validAsset.symbol} deposit activity at this moment.`,
        );
      }

      const session = await mongoose.startSession();

            await session.withTransaction(async () => {
                const txn = new TransactionDb({
                    reference: `myke_poc${uuidv4()}`,
                    user: from.user,
                    asset: validAsset.id,
                    status: TransactionStatus.SUCCESS, // since it's same system, no waiting for webhook
                    amount: params.amount,
                    fee: 0,
                    reason: params.metadata?.reason || 'p2p transfer',
                    totalAmount: params.amount,
                    clerkType: ClerkType.DEBIT,
                    type: params.transferType,
                    description: params.metadata?.description || 'p2p transfer',
                })

                const depositTxn = new DepositDb({
                    user: to.user,
                    asset: validAsset.id,
                    transaction: txn.id,
                    amount: params.amount,
                    status: TransactionStatus.SUCCESS,
                    reference: txn.reference,
                    metadata: params.metadata
                })
                const withdrawalTxn = new WithdrawalDb({
                    user: from.user,
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

        const toLedger = new LedgerDb({
          asset: validAsset.id,
          user: to.user,
          transaction: txn.id,
          clerkType: ClerkType.CREDIT,
          entryType: params.transferType,
          availableDelta: params.amount,
          availableBalance: toNext,
          pendingDelta: 0,
          pendingBalance: to.pendingBalance,
        });
        const fromLedger = new LedgerDb({
          asset: validAsset.id,
          user: from.user,
          transaction: txn.id,
          clerkType: ClerkType.DEBIT,
          entryType: params.transferType,
          availableDelta: -params.amount,
          availableBalance: fromNext,
          pendingDelta: 0,
          pendingBalance: from.pendingBalance,
        });

        // do not use promise.all
        await txn.save({ session });
        await withdrawalTxn.save({ session });
        await depositTxn.save({ session });
        await toLedger.save({ session });
        await fromLedger.save({ session });

        await UserAssetDb.updateOne(
          { _id: from.id },
          { $set: { availableBalance: fromNext } },
        ).session(session);

        await UserAssetDb.updateOne(
          { _id: to.id },
          { $set: { availableBalance: toNext } },
        ).session(session);
      });

      session.endSession();
    } catch (error: unknown) {
      throw error;
    }
  }

  static async replay() {
    const ledgers: Ledger[] = await LedgerDb.find().sort({ createdAt: 1 });

    // Group by user + asset combo for proper reconciliation
    const balances = new Map<string, { available: number; pending: number }>();

    for (const l of ledgers) {
      const key = `${l.user}:${l.asset}`;
      const prev = balances.get(key) ?? { available: 0, pending: 0 };
      balances.set(key, {
        available: prev.available + l.availableDelta,
        pending: prev.pending + l.pendingDelta,
      });
    }

    // Update each user asset with their final balance
    for (const [key, balance] of balances.entries()) {
      const [userId, assetId] = key.split(":");
      await UserAssetDb.updateOne(
        { user: userId, asset: assetId },
        {
          $set: {
            availableBalance: balance.available,
            pendingBalance: balance.pending,
          },
        },
      );
    }

    return balances;
  }

  static async auditAccount(accountId: string) {
    const entries = await LedgerDb.find({ asset: accountId }).sort({
      createdAt: 1,
    });
    if (!entries || entries.length === 0) {
      throw new Error(`No ledger entries found for account: ${accountId}`);
    }
    return entries;
  }

  static async auditTransaction(transactionId: string) {
    const entries = await LedgerDb.find({ transaction: transactionId }).sort({
      createdAt: 1,
    });
    if (!entries || entries.length === 0) {
      throw new Error(
        `No ledger entries found for transaction: ${transactionId}`,
      );
    }
    return entries;
  }

  static async validateLedger() {
    // Validate that all available deltas sum to zero (double-entry principle)
    const availableAgg = await LedgerDb.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$availableDelta" },
        },
      },
    ]);

    const availableTotal = availableAgg[0]?.total ?? 0;

    if (availableTotal !== 0) {
      throw new Error(
        `Available balance invariant violated: ${availableTotal}`,
      );
    }

    // Validate that all pending deltas sum to zero
    const pendingAgg = await LedgerDb.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$pendingDelta" },
        },
      },
    ]);

    const pendingTotal = pendingAgg[0]?.total ?? 0;

    if (pendingTotal !== 0) {
      throw new Error(`Pending balance invariant violated: ${pendingTotal}`);
    }

    return true;
  }

    static async withdraw(params: {
        senderAccountEmail: string;
        receiverAccountEmail: string;
        amount: number;
    }) {
        return this.transfer({
            fromAccount: params.senderAccountEmail,
            toAccount: params.receiverAccountEmail,
            amount: params.amount,
            assetType: AssetType.POUND,
            transferType: TransactionType.WITHDRAWAL,
        });
    }


}