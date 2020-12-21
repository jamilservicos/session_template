"use strict";

/*
function examples, improve and modify according to your need
*/

const nacl = require('tweetnacl'); // database encrypt/decrypt
nacl.util = require('tweetnacl-util'); // utils to nacl
const crypto = require('crypto'); // create hash
const model = require('./model/sessions'); //schema

const toParse = data => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return data;
    }
};
const toString = data => {
    try {
        if (typeof data === "object") return JSON.stringify(data);
        return data;
    } catch (e) {
        return data;
    }
};

const utils = Object.assign({});
utils.decodeUTF8 = function (s) {
    if (typeof s !== 'string') throw new TypeError('expected string');
    let d = unescape(encodeURIComponent(s));
    let b = new Uint8Array(d.length);
    for (let i = (d.length - 1); i >= 0; i--) b[i] = d.charCodeAt(i);
    return b;
};
utils["close"] = (data, str) => {
    try {
        const newNonce = () => nacl.randomBytes(24);
        if (data) {
            const key = utils.decodeUTF8(str);
            const nonce = newNonce();
            const msg = nacl.util.decodeUTF8(toString(data));
            if ((nonce) && (msg) && (key)) {
                const encrypted = nacl.secretbox(msg, nonce, key);
                if (encrypted) {
                    const over = nacl.randomBytes(16);
                    const fulldata = new Uint8Array(16 + 24 + encrypted.length);
                    fulldata.set(over);
                    fulldata.set(nonce, 16);
                    fulldata.set(encrypted, 40);
                    return Buffer.from(fulldata);
                }
            }
        }
        return true;
    } catch (err) {
        return true;
    }
};
utils["open"] = (data, str) => {
    try {
        if (data) {
            if (Buffer.isBuffer(data)) {
                const dataEncrypted = new Uint8Array(Array.prototype.slice.call(Buffer.from(data, "binary"), 0));
                if (dataEncrypted) {
                    const key = utils.decodeUTF8(str);
                    const nonce = dataEncrypted.slice(16, 40);
                    const box = dataEncrypted.slice(40, dataEncrypted.length);
                    if ((key) && (nonce) && (box)) {
                        const decrypted = nacl.secretbox.open(box, nonce, key);
                        if (decrypted) {
                            const msgJson = nacl.util.encodeUTF8(decrypted);
                            if (msgJson) return toParse(msgJson);
                        }
                    }
                }
            } else {
                return data;
            }
        } else return true;
    } catch (err) {
        return true;
    }
};

class DbMongo {
    addOrUpdate = (_hash, schema) => {
        /*
        routine called to add and/or modify
        */
        const that = this;
        const where = {
            hash: _hash.toString()
        };
        const query = Object.assign({}, schema);
        try {
            setTimeout(() => that.sessions.model.updateOne(where, query, {
                    upsert: true
                })
                .then(() => true)
                .catch(() => true), 500); // 500ms delay to avoid duplication.
            return true;
        } catch (err) {
            return true;
        }
    };
    renew = (schema) => {
        /*
        routine called when renewing session
        */
        const that = this;
        const query = Object.assign({}, schema);
        try {
            const addDb = new that.sessions.model(query);
            return addDb.save()
                .then(() => true)
                .catch(() => true);
        } catch (err) {
            return true;
        }
    };
    remove = (_hash) => {
        /*
        routine called when removing session
        */
        const that = this;
        try {
            return that.sessions.model.deleteMany({
                    hash: _hash.toString()
                })
                .then(() => true)
                .catch(() => true);
        } catch (err) {
            return true;
        }
    };
    open = (data) => {
        const that = this;
        return utils.open(data, that.str);
    };
    close = (data) => {
        const that = this;
        return utils.close(data, that.str);
    };
    constructor(options, store) {
        if (store) {
            this.sessions = model({close: this.close, open: this.open}); //model and connection
            store.database(this); // starts synchronization with the memory manager
        }
        if ((options) && (options.store) && (options.secret)) {
            this.str = crypto.createHash('md5')
                .update(options.store + options.secret)
                .digest('hex');
        }
    }
}

exports = module.exports = DbMongo;
/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
