"use strict";
/*
exemplo de proxy
*/

const Proxy = {
    set: (target, key, value) => {
        if(key === 'id') return target.id;
        if(key === 'show') return target.show;
        //
        const targetValue = Reflect.get(target, key);
        if(typeof targetValue === "function") return target[key].call(this, value);
        return false;
    },
    get: (target, key, receiver) => {
        if(key === 'id') return target.id;
        if((typeof key === "undefined") && (key === 'show')) return target.show;
        const targetValue = Reflect.get(target, key, receiver);
        if(typeof targetValue === "function") return (...args) => targetValue.apply(this, args);
        if (key) {
            if (key === 'prototype') return Reflect.get(...arguments);
        }
        const reflect = Reflect.get(...arguments);
        if(typeof reflect === "undefined") return target.getter(key);
        return undefined;
    },
    ownKeys: () => {
        return ['add', 'show', 'delete', 'destroy'];
    }
}

exports = module.exports = Proxy;

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
