import mongoose from 'mongoose';
import {config} from '../../config';
import {ActivityStatus, AssetSymbol, AssetType, Asset} from '../../interfaces';
import {v4 as uuidv4} from 'uuid';

const Schema = mongoose.Schema;

const AssetSchema = new Schema<Asset>({
    _id: {
        type: String,
        default: function genUUID() {
            return uuidv4();
        }
    },
    assetType: {
        type: String,
        enum: Object.values(AssetType),
        default: AssetType.POUND,
        required: true
    },

    symbol: {
        type: String,
        required: true,
        enum: Object.values(AssetSymbol)
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

AssetSchema.index({user: 1, symbol: 1}, {unique: true});
export const AssetDb = mongoose.model<Asset>(config.mongodb.collections.assets, AssetSchema);