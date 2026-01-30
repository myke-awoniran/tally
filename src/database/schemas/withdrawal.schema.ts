import mongoose from 'mongoose';
import {config} from '../../config';
import {v4 as uuidv4} from 'uuid';
import {TransactionStatus} from '../../interfaces';

const Schema = mongoose.Schema;

const WithdrawalSchema = new Schema(
    {
        _id: {
            type: String,
            default: function genUUID() {
                return uuidv4();
            }
        },

        user: {
            type: String,
            required: true,
            ref: config.mongodb.collections.users,
            index: true
        },

        asset: {
            type: String,
            required: true,
            ref: config.mongodb.collections.assets,
            index: true
        },

        transaction: {
            type: String,
            ref: config.mongodb.collections.transactions,
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true
        },

        fee: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: Object.values(TransactionStatus),
            required: true,
            default: TransactionStatus.PENDING
        },

        reference: {
            type: String,
            required: true,
            index: true
        },

        destination: {
            type: String,
            required: true,
            references: config.mongodb.collections.users,
        },

        metadata: {
            type: Object
        }
    },
    {
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
    }
);

WithdrawalSchema.index({user: 1, reference: 1});

export const WithdrawalDb = mongoose.model(
    config.mongodb.collections.withdrawals,
    WithdrawalSchema
);
