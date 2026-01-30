import * as mongoose from 'mongoose';
import {Schema} from 'mongoose';
import {config} from '../../config';
import {v4 as uuidv4} from 'uuid';


export enum USER_STATUS {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DEACTIVATED = 'DEACTIVATED',
}

export interface User extends mongoose.Document {
    id: string;
    _id: string;
    username: string;
    email: string;
    firstName: string;
    phone: string;
    lastName: string;
    status: USER_STATUS;
}


const UserSchema = new Schema<User>({
        _id: {
            type: String, default: function genUUID() {
                return uuidv4();
            }
        },
        email: {
            type: String,
            required: true,
            lowerCase: true,
            true: true,
            unique: true
        },

        firstName: {
            type: String,
            required: true
        },
        username: {
            type: String,
            // unique: true,
            lowercase: true
        },

        phone: {
            type: String
        },

        lastName: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: Object.values(USER_STATUS),
            default: USER_STATUS.ACTIVE
        },
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

export const UserDb = mongoose.model<User>(config.mongodb.collections.users, UserSchema);