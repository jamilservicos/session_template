"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;
/*
env:
MONGODB=mongodb://localhost:27017
*/
const sessionInstance = mongoose.createConnection(`${process.env.MONGODB}/sessions`, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    autoIndex: false,
    useFindAndModify: false,
    autoCreate: true
});
exports = module.exports = (dbutils) => {
    const SessionSchema = new Schema({
        hash: {type: String, required: true, index: true},
        previous: {type: String},
        data: {type: Buffer, default: undefined, set: dbutils.close, get: dbutils.open},
        timestamp: {type: Number, default: undefined}
    }, {toObject: {getters: true}, toJSON: {getters: true}});

    const SessionLoader = Object.assign({});
    SessionLoader["model"] = sessionInstance.model("Session", SessionSchema);
    const indexModel = async () => {
        try {
            await SessionLoader.model.init();
            const indexes = await SessionLoader.model.listIndexes();
            if (indexes) return indexes;
        } catch (e) {
            await SessionLoader.model.createIndexes();
            return await SessionLoader.model.syncIndexes();
        }
    };
    (async () => await indexModel())();
    return SessionLoader;
};

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
