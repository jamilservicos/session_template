"use strict";
/*
remembering that this is a basic code and needs to be customized according to your needs
*/

const moment = require('moment'); //i use moment for convenience
const crypto = require('crypto');
const cookieserial = require('./fn_cookie_serialize');
const _s = require('underscore.string');

const defaults = {
    path: '/',
    maxAge: 3600 //seconds
};
const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const genHash = (str) => crypto.createHash('sha1').update(str.toString()).digest('hex');

class Cookie {
    verify = (data, keys, signatureb64) => {
        if (base64regex.test(signatureb64)) {
            const signature = Buffer.from(signatureb64, 'base64');
            const publicKey = keys.publicKey;
            const isVerified = crypto.verify(
                "sha256",
                Buffer.from(data), {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                }, signature);
            if (isVerified) return isVerified;
            return false;
        }
        return false;
    };
    sign = (data, keys) => {
        const privateKey = keys.privateKey;
        const signature = crypto.sign("sha256", Buffer.from(data), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        });
        if (signature) return data + signature.toString("base64");
        return false;
    };
    parse = (name) => {
        const that = this;
        const request = that.req.headers;
        const dataparse = Object.assign({});
      /*
      remember that I'm using restify as an example, adapt to the header of the server you're using.
      */
        if (request.cookie) { 
            const data = request.cookie.split(';');
            if ((data) && (data.length > 0)) {
                for (let i = (data.length - 1); i >= 0; i--) {
                    const item = data[i];
                    if (item) {
                        const parts = item.split('=');
                        dataparse[parts.shift().trim()] = decodeURI(parts.join('='));
                        if (i === 0) {
                            if ((dataparse[name]) &&
                                (dataparse[name].substr(0, 2) === 's:')) return dataparse[name].slice(2);
                            return {
                                error: 2
                            };
                        }
                    }
                }
            } else return {
                none: 2
            };
        } else return {
            none: 1
        };
        return undefined;
    };
    make = (sid, _name, keys) => {
        const that = this;
        const configcookie = Object.assign({}, defaults);
        //
        configcookie['sameSite'] = true;
        configcookie['httpOnly'] = true;
        configcookie['secure'] = false; // this is false for testing only, set to true in production
        configcookie['domain'] = that.domain;
        configcookie['expires'] = new Date(Number(moment().add(defaults.maxAge, 'seconds').valueOf()));
        //
        const signature = that.sign(sid, keys);
        if (signature) {
            const serialize = cookieserial(signature, Object.assign({}, configcookie, {
                name: _name
            }));
            if (serialize) {
                if (serialize.error) return {
                    error: 1
                };
                return {
                    signed: signature,
                    serial: serialize
                };
            } else return false;
        } else return false;
    };
    read = (opts, id) => {
        const that = this;
        const sid = id;
        const parsecookie = that.parse(opts.cookie.name);
        if (parsecookie) {
            if (typeof parsecookie === "object") {
                const guest = that.make(sid, opts.cookie.name, {
                    publicKey: opts.cookie.publicKey,
                    privateKey: opts.cookie.privateKey
                });
                if (guest) {
                    if ((guest.serial) && (guest.signed)) {
                        return guest;
                    } else return {};
                } else return {};
            } else {
                if (typeof parsecookie === "string") {
                    const signedSid = parsecookie.slice(0, 39);
                    const signature = parsecookie.slice(39);
                    const checked = that.verify(signedSid, {
                        publicKey: opts.cookie.publicKey,
                        privateKey: opts.cookie.privateKey
                    }, signature);
                    if (checked) {
                        const configcookie = Object.assign({}, defaults);
                        const hash = genHash(parsecookie);
                        if (hash) {
                            const exists = that.store.find(hash.toString()); //search the cache in memory
                            if (_s.isBlank(exists)) {
                                const guest = that.make(sid, opts.cookie.name, {
                                    publicKey: opts.cookie.publicKey,
                                    privateKey: opts.cookie.privateKey
                                });
                                if (guest) {
                                    if ((guest.serial) && (guest.signed)) {
                                        return guest;
                                    } else return {};
                                } else return {};
                            } else {
                                const expired = Number(moment().subtract((defaults.maxAge / 2), 'seconds').unix()); //checks expiration for half the time lost, to avoid early expiration and/or very old cookies
                                if (exists.signed !== parsecookie) return {
                                    error: 1
                                };
                                if (expired >= exists.timestamp) { //if true, then the session is reset.
                                    const guest = that.make(sid, opts.cookie.name, {
                                        publicKey: opts.cookie.publicKey,
                                        privateKey: opts.cookie.privateKey
                                    });
                                    if (guest) {
                                        if ((guest.serial) && (guest.signed)) {
                                            return guest;
                                        } else return {};
                                    } else return {};
                                } else exists.timestamp = Number(moment().unix());
                                configcookie['sameSite'] = true;
                                configcookie['httpOnly'] = true;
                                configcookie['secure'] = false; // this is false for testing only, set to true in production
                                configcookie['domain'] = that.domain;
                                configcookie['expires'] = new Date(Number(moment().add(defaults.maxAge, 'seconds').valueOf()));
                                //
                                if (exists["userdata"]) { // example of trigger key for authenticated session
                                    // start regenerateid
                                    const newsigned = that.sign(sid, {
                                        publicKey: opts.cookie.publicKey,
                                        privateKey: opts.cookie.privateKey
                                    });
                                    if (newsigned) {
                                        const renewhash = genHash(newsigned);
                                        const serialize = cookieserial(newsigned, Object.assign({}, configcookie, {
                                            name: opts.cookie.name
                                        }));
                                        if (serialize) {
                                            if (serialize.error) return {
                                                error: 1
                                            };
                                            return {
                                                signed: newsigned,
                                                serial: serialize,
                                                exist: exists,
                                                renew: renewhash
                                            };
                                        } else return false;
                                    } else return {
                                        error: 'error new signed'
                                    };
                                    // end regenerateid
                                } else {
                                    // some id
                                    const serialize = cookieserial(parsecookie, Object.assign({}, configcookie, {
                                        name: opts.cookie.name
                                    }));
                                    if (serialize) {
                                        if (serialize.error) return {
                                            error: 1
                                        };
                                        return {
                                            signed: parsecookie,
                                            serial: serialize,
                                            exist: exists
                                        };
                                    } else return false;
                                    //some id
                                }
                                //
                            }
                        } else return {
                            error: 'error genHash'
                        };
                        //
                    } else return {};
                } else return {};
            }
        } else {
            const guest = that.make(sid, opts.cookie.name, {
                publicKey: opts.cookie.publicKey,
                privateKey: opts.cookie.privateKey
            });
            if (guest) {
                if ((guest.serial) && (guest.signed)) {
                    return guest;
                } else return {};
            } else return {};
        }
    };
    constructor(req, store) {
        this.req = req;
        this.store = store;
        Object.defineProperty(this, 'req', {
            enumerable: false
        });
        Object.defineProperty(this, 'store', {
            enumerable: false
        });
        Object.defineProperty(this, 'read', {
            enumerable: false
        });
        Object.defineProperty(this, 'make', {
            enumerable: false
        });
        Object.defineProperty(this, 'parse', {
            enumerable: false
        });
        Object.defineProperty(this, 'sign', {
            enumerable: false
        });
        Object.defineProperty(this, 'verify', {
            enumerable: false
        });
    }
}

exports = module.exports = Cookie;

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
