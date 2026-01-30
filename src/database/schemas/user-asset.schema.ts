import mongoose from 'mongoose';
import {config} from '../../config';
import {ActivityStatus, UserAsset} from '../../interfaces';
import {v4 as uuidv4} from 'uuid';

const Schema = mongoose.Schema;

const UserAssetSchema = new Schema<UserAsset>({
    _id: {
        type: String,
        default: function genUUID() {
            return uuidv4();
        }
    },

    asset: {
        type: String,
        ref: config.mongodb.collections.assets,
        required: true
    },

    user: {
        index: true,
        type: String,
        ref: config.mongodb.collections.users,
        required: true
    },

    withdrawalActivity: {
        type: String,
        enum: Object.values(ActivityStatus),
        default: ActivityStatus.ACTIVE
    },

    availableBalance: {
        type: Number,
        required: true,
        default: 0.0
    },

    pendingBalance: {
        type: Number,
        required: true,
        default: 0.0
    },

    depositActivity: {
        type: String,
        enum: Object.values(ActivityStatus),
        default: ActivityStatus.ACTIVE
    }
}, {
    toObject: {
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        }
    },
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        }
    },
    versionKey: false,
    timestamps: true
});

UserAssetSchema.index({user: 1, symbol: 1}, {unique: true});
export const UserAssetDb = mongoose.model<UserAsset>(config.mongodb.collections.userAssets, UserAssetSchema);