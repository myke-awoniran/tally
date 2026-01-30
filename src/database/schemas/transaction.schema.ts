import * as mongoose from 'mongoose';
import {Schema} from 'mongoose';
import {config} from '../../config';
import {v4 as uuidv4} from 'uuid';
import {AssetSymbol, AssetType, ClerkType, Transaction, TransactionStatus, TransactionType} from '../../interfaces';

const TransactionSchema = new Schema<Transaction>({
    _id: {
        type: String, default: function genUUID() {
            return uuidv4();
        }
    },

    reference: {
        type: String,
        required: true
    },

    user: {
        type: String,
        required: true,
        ref: config.mongodb.collections.users
    },

    asset: {
        type: String,
        required: true,
        ref: config.mongodb.collections.assets,
    },

    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    fee: {
        type: Number,
        required: true
    },

    totalAmount: {
        type: Number,
        required: true
    },

    clerkType: {
        type: String,
        required: true,
        enum: Object.values(ClerkType)
    },

    type: {
        type: String,
        required: true,
        enum: Object.values(TransactionType)
    },

    reason: {
        type: String,
        required: true // withdrawal ID or deposit ID
    },

    description: {
        type: String
    },

    metadata: {
        type: Object
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
    timestamps: true, versionKey: false
});

export const TransactionDb = mongoose.model<Transaction>(config.mongodb.collections.transactions, TransactionSchema);