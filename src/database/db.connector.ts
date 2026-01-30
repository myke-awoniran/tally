import mongoose from 'mongoose';
import {config} from '../config';
import {Logger} from '../helpers/Logger';

export async function connectMongoDb() {
    try {
        mongoose.connect(config.mongodb.uri);
        mongoose.connection.on('connected', () => {
            Logger.Info('Mongo Connection Established');
        });
        mongoose.connection.on('error', (err) => {
            console.error(`Mongo Connection Error : ${err}`);
            process.exit(1);
        });
        mongoose.connection.on('disconnected', () => {
            Logger.Error('MongoDb connection disconnected');
            process.exit(1);
        });
        //If the Node process ends, close the Mongoose connection
        process.on('SIGINT', async () => {
            try {
                Logger.Error('Mongoose default connection disconnected through app termination');
                await mongoose.connection.close(true);
            } catch (err) {
                Logger.Error(`Could not close connection${err}`);
            }
            process.exit(0);
        });
    } catch (error: unknown) {
        console.log(error);
        Logger.Error('Error in connecting to MongoDb', error)
    }
}