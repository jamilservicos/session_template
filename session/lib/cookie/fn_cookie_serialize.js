"use strict";
/*
function to serialize the cookie.
*/

exports = module.exports = (data, obj) => {
    try {
        let str = obj.name + '=s:' + data;
        if (obj.maxAge) {
            const maxAge = obj.maxAge;
            if (isNaN(maxAge) || !isFinite(maxAge)) return {error: 'option maxAge is invalid'};
            str += '; Max-Age=' + maxAge;
        }
        if (obj.domain) str += '; Domain=' + obj.domain;
        if (obj.path) str += '; Path=' + obj.path;
        if (obj.expires) {
            if (typeof obj.expires.toUTCString !== 'function') return {error: 'option expires is invalid'};
            str += '; Expires=' + obj.expires.toUTCString();
        }
        if (obj.httpOnly) str += '; HttpOnly';
        if (obj.secure) str += '; Secure';
        if (obj.sameSite) {
            let sameSite;
            if (typeof obj.sameSite === 'string') {
                sameSite = obj.sameSite.toLowerCase();
            } else sameSite = obj.sameSite;
            switch (sameSite) {
                case true:
                    str += '; SameSite=Strict';
                    break;
                case 'lax':
                    str += '; SameSite=Lax';
                    break;
                case 'strict':
                    str += '; SameSite=Strict';
                    break;
                case 'none':
                    str += '; SameSite=None';
                    break;
                default:
                    return {error: 'option sameSite is invalid'};
            }
        }
        return str;
    } catch (err) {
        return {error: 1};
    }
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
