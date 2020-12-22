"use strict";

const moment = require('moment');
const Dot = require('dot-object');
const dot = new Dot('->'); // see https://github.com/rhalff/dot-object to more details.
const _s = require('underscore.string');

const generate = require('nanoid/generate');
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

const Cookie = require('../cookie/fn_cookie');

const genId = () => 'sid' + generate(alphabet, 36); //generate session id

class Session {
    add = (key, value) = {
        const that = this;
        if ((that._id) && (key) && (value)) {
            if (key === 'timestamp') {
                this._db[key] = value;
                that.store.sync(this._db);
                return true;
            } else {
                if (typeof value === "string") {
                    if (typeof key === "string") {
                        dot.pick(key, this._db, true); //dot pick override fix
                        if (dot.str(key, value, this._db, _s.clean)) that.store.sync(this._db); // verify the key, add the value and synchronize the memory and database
                        return true;
                    } else {
                        this._db[key] = _s.clean(value);
                        that.store.sync(this._db);
                        return true;
                    }
                } else {
                    if (typeof key === "string") {
                        dot.pick(key, this._db, true); //dot pick override fix
                        if (dot.str(key, value, this._db, undefined)) that.store.sync(this._db); //dot value object fix
                    } else {
                        this._db[key] = value;
                        that.store.sync(this._db); // synchronize the memory and database
                    }
                    return true;
                }
            }
        } else return undefined;
    };
    delete = (key, value) = {
        const that = this;
        if ((key) && (this._db[key])) {
            if ((key === 'timestamp') || (key === 'hash') || (key === 'userdata')) { // mandatory keys to save session.
                return that.destroy(); //destroy session
            } else {
                dot.pick(key, this._db, true);
                that.store.sync(this._db); // synchronize the memory and database
                return true;
            }
        } else return false;
    };
    destroy = () => {
        const that = this;
        const key = that._db['hash']; //get hash key
        this._db = Object.assign({}); //tmp session
        if (key) that.store.remove(key); // sync memory and database
        return true;
    };
    toJSON = () => {
        try {
            const that = this;
            return that._db;
        } catch (err) {
            return {};
        }
    };
    getter = (key) => {
        const that = this;
        if (typeof key === "string") {
            const value = dot.pick(key, that._db, undefined);
            if (value) return value;
            return undefined;
        } else {
            if (that._db[key]) return that._db[key];
            return undefined;
        }
    };


    constructor(req, store) {
        this.req = req;
        this.store = store;
        this._id = genId();
        this._last = undefined;
        this._db = Object.assign({}); // non-persistent cache (tmp session)
        this.cookie = new Cookie(req, store); // starts cookie manager, pointing the request and memory cache manager
        this.help = "Commands allowed:\n" +
            "help: to see help, use: req.session.help\n" +
            "toJSON: to return all fields in JSON, use: req.session.JSON ()\n" +
            "show: to return all fields in object, use: req.session.show\n" +
            "add: to add, use: req.session.add (key, value)\n" +
            "delete: to delete, use: req.session.delete (key)\n" +
            "destroy: to reset a session, use: req.session.destroy ()";

        Object.defineProperty(this, 'req', {
            enumerable: false
        });
        Object.defineProperty(this, 'store', {
            enumerable: false
        });
        Object.defineProperty(this, '_id', {
            enumerable: false
        });
        Object.defineProperty(this, '_last', {
            enumerable: false
        });
        Object.defineProperty(this, '_db', {
            enumerable: false
        });
        Object.defineProperty(this, 'cookie', {
            enumerable: false
        });

        Object.defineProperty(this, 'add', {
            enumerable: false
        });
        Object.defineProperty(this, 'delete', {
            enumerable: false
        });
        Object.defineProperty(this, 'destroy', {
            enumerable: false
        });

        Object.defineProperty(this, 'toJSON', {
            enumerable: false
        });
        Object.defineProperty(this, 'getter', {
            enumerable: false
        });
        return new Proxy(this, require('./proxy'));
    }
}

exports = module.exports = Session;

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
