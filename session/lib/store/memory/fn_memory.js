"use strict";
/*
this class will write to memory cache, and as example, I'm using base62.
but if you want more security you can apply the database encryption function here, and just copy over to database.
however, the more processing in the cache, the longer the response time.
 */
const crypto = require('crypto');
const moment = require('moment'); // i use moment.js for convenience
const Node = require('./fn_node');

const genHash = (str) => crypto.createHash('sha1').update(str.toString()).digest('hex');

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bs62 = require('base-x')(BASE62);

class MemoryStore {
    set = (key, value) => {
        const that = this;
        const maxAge = Number(that.maxAge);
        const expires = Number(moment().add(maxAge, 'milliseconds').unix());
        if ((key) && (value)) return that.store[key] = new Node(key, value, maxAge, expires); //inspired on https://github.com/arbazsiddiqui/lru-cache-node
        return true;
    };
    sync = (_tmp) => {
        const that = this;
        if ((_tmp.signed) && (_tmp.timestamp)) {
            const obj = Object.assign({}, {
                hash: genHash(_tmp.signed),
                createdAt: _tmp.timestamp
            }, _tmp);
            const enc = bs62.encode(Buffer.from(JSON.stringify(obj))); // insecure encryption, just to example, modify as needed.
            if (enc) {
                const key_ = obj.hash.toString();
                const value_ = enc.toString();
              /*
              userdata, is the field that filters what needs to be saved in the database. for example ... authenticated session only
              userdata: { username: "teste"}
              */
                if ((that["mongodb"]) && (_tmp["userdata"]) && (obj["hash"])) {
                    try {
                        const _hash = obj.hash.toString();
                        const schema = {
                            hash: key_,
                            data: obj,
                            timestamp: Number(_tmp.timestamp)
                        };
                        that.mongodb.addOrUpdate(_hash, schema); // sends the backup to the database
                    } catch (err) {
                    }
                }
                return that.set(key_, value_); //saves it to memory
            }
        }
        return true;
    };
    renew = (oldhash, newdata) => {
        const that = this;
        if ((oldhash) && (newdata.hash) && (newdata.signed) && (newdata.timestamp)) {
            const obj = Object.assign({}, {
                hash: newdata.hash
            }, newdata);
            const enc = bs62.encode(Buffer.from(JSON.stringify(obj))); // insecure encryption, just to example, modify as needed.
            if (enc) {
                that.remove(oldhash); // remove old session cache and database backup.
                const key_ = obj.hash.toString();
                const value_ = enc.toString();
              /*
              userdata, is the field that filters what needs to be saved in the database. for example ... authenticated session only
              userdata: { username: "teste"}
              */
                if ((that["mongodb"]) && (obj["userdata"]) && (obj["hash"])) {
                    try {
                        const _hash = oldhash.toString();
                        const schema = {
                            hash: obj.hash.toString(), // new session hash
                            previous: _hash, // old session hash
                            data: obj,
                            timestamp: Number(obj.timestamp)
                        };
                        that.mongodb.renew(schema); // sends the new backup to the database
                    } catch (err) {
                    }
                }
                return that.set(key_, value_); //saves it to memory
            }
        }
        return true;
    };
    find = (key) => {
        /*
        find hash on local storage
        */
        const node = this.store[key];
        if (node) {
            const content = node.getValue();
            const buf = bs62.decode(content); // insecure decryption, just to example, modify as needed.
            if (buf) {
                const parse = JSON.parse(buf.toString())
                if (parse) return parse;
            } 
        } else return undefined;
    };
    remove = (key) => {
        try {
            const that = this;
            if (key) {
                if (this.store[key]) delete this.store[key]; // remove from memory cache
                if (that.mongodb) that.mongodb.remove(key); //remove from the database
            }
        } catch (err) {
        }
        return true;
    };
    autoclean = () => {
        /*
        check and remove expired sessions
        */
        const that = this;
        const store = this.store;
        const storeKeys = Object.keys(store);
        const _now = moment();
        const expired = Number(_now.subtract(that.maxAge, 'milliseconds').unix());

        if ((storeKeys) && (storeKeys.length > 0)) {
            for (let i = (storeKeys.length - 1); i >= 0; i--) {
                const item = store[storeKeys[i]];
                if (item) {
                    const timestamp = item.getExpiry();
                    if ((timestamp) && (expired >= Number(timestamp))) that.remove(storeKeys[i]);
                }
                if (i === 0) setTimeout(() => that.autoclean(), 5000); //automatically restarts the autoclean after 5 seconds
            }
        } else setTimeout(() => that.autoclean(), 10000); //automatically restarts the autoclean after 10 seconds
    };
    database = (db) => {
      /*
      restores all database sessions to memory after restarting the server.
      */
        if (db) {
            this.mongodb = db; //activates the communication variable with the database
            const that = this;
            return that.mongodb.sessions.model.find({}).select({
                data: 1
            }).then(r => {
                if ((r) && (r[0])) {
                    for (let i = (r.length - 1); i >= 0; i--) {
                        const item = r[i].data;
                        if ((item) && (item.hash) && (item.timestamp)) {
                            const enc = bs62.encode(Buffer.from(JSON.stringify(item))); // insecure encryption, just to example, modify as needed.
                            if (enc) {
                                const key = item.hash;
                                const value = enc.toString();
                                //
                                const maxAge = Number(that.maxAge);
                                const expires = Number(moment().add(maxAge, 'milliseconds').unix());
                                if ((key) && (value)) that.store[key] = new Node(key, value, maxAge, expires);
                            }
                        }
                    }
                }
            }).catch(() => true);
        }
    };
    constructor(store) {
        this.store = store; // object responsible for local memory
        this.maxAge = (1000 * 60 * 60); // 1 hours
        setTimeout(() => this.autoclean(), 5000); //automatically starts the autoclean after 5 seconds
    }
}

exports = module.exports = MemoryStore;

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
