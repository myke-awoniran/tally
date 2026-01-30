import mongoose from 'mongoose';
import {config} from '../../config';
import {v4 as uuidv4} from 'uuid';
import {ClerkType, TransactionType} from '../../interfaces';

export interface Ledger {
    id: string;
    _id: string;
    asset: string;
    clerkType: ClerkType;
    entryType: TransactionType;
    user: string;
    transaction: string;
    availableBalance: number;
    availableDelta: number;
    pendingBalance: number;
    pendingDelta: number;
}

const LedgerSchema = new mongoose.Schema<Ledger>({
    _id: {
        type: String, default: function genUUID() {
            return uuidv4();
        }
    },

    asset: {
        index: true,
        type: String,
        ref: config.mongodb.collections.assets,
        required: true
    },

    clerkType: {
        type: String,
        enum: Object.values(ClerkType),
        required: true
    },

    entryType: {
        type: String,
        enum: Object.values(TransactionType),
        required: true
    },

    user: {
        index: true,
        type: String,
        ref: config.mongodb.collections.users,
        required: true
    },

    transaction: {
        type: String,
        required: true,
        ref: config.mongodb.collections.transactions,
        index: true
    },

    availableBalance: {
        type: Number,
        required: true
    },

    availableDelta: {
        type: Number,
        required: true
    },

    pendingBalance: {
        type: Number,
        required: true
    },

    pendingDelta: {
        type: Number,
        required: true
    }

}, {
    toObject: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    },
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    },
    timestamps: true,
    versionKey: false
});

export const LedgerDb = mongoose.model<Ledger>(config.mongodb.collections.ledgers, LedgerSchema);

