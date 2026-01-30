import * as mongoose from 'mongoose';

export interface Transaction extends mongoose.Document {
    reference: string;
    user: string;
    asset: string;
    symbol: string;
    status: string;
    amount: number;
    fee: number;
    totalAmount: number;
    clerkType: string;
    type: string;
    reason: string;
    description: string;
    metadata: object;
}

export enum ClerkType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT'
}

export enum AssetSymbol {
    NGN = 'NGN',
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR'
}

export enum AssetType {
    NAIRA = 'NAIRA',
    DOLLAR = 'DOLLAR',
    POUND = 'POUND',
    EURO = 'EURO'
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    REVERSAL = 'REVERSAL'
}

export enum TransactionStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PENDING = 'PENDING',
}
