"use strict";
/*
class inspired on https://github.com/arbazsiddiqui/lru-cache-node
 */
 
class MemoryStoreNode {
    constructor(key, value, maxAge, expires) {
        if (key === undefined)
            throw new Error("Key not provided");
        if (value === undefined)
            throw new Error("Value not provided");
        this.content = {key, value};
        this.maxAge = typeof maxAge === 'number' ? maxAge : Infinity;
        this.expires = typeof expires === 'number' ? expires : Infinity;
    }

    getValue() {
        return this.content.value
    }

    getMaxAge() {
        return this.maxAge
    }

    getExpiry() {
        return this.expires
    }

    getKey() {
        return this.content.key
    }
}

exports = module.exports = MemoryStoreNode;

/*
# donate to the developer
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
*/
