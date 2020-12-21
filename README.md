# This is not a module for installation and use, but an example for creating your own session manager
The intention is to create a base for session manager compatible with all http servers(node js or deno).

Do not forget to install the dependencies according to your need, I will not list the dependencies used here, to force the reading and modification of the code.

modify, improve and customize according to your need, but don't use it as it is.
these are only functional examples, but should not be used in production.

config.js example:
```
exports = module.exports = {
session: {
store: process.env.SESS_STORE, // salt to strengthen encryption
secret: process.env.SESS_SECRET // password to encryption
},
cookie: {
name: 'sid', //cookie name
publicKey: process.env.PEMPUB, // passed to crypto.createPrivateKey()
privateKey: process.env.PEMPRV // passed to crypto.createPublicKey()
}
};
```

*recommended to create a separate file and compile in jsc
```
$ bytenode -c config.js
```
see https://github.com/OsamaAbbas/bytenode to more details.

main.js example:
```
const bytenode = require('bytenode');
const configsesion = require(__dirname + '/config.jsc');
const sessions = require(__dirname + '/session'); //folder location

const restify = require('restify'); // i will use restify as a target server for example
const server = restify.createServer();
server.use(sessions(configsesion));
```

# Attention!
all the codes contained in the "session" folder of this repository, this is just for base to create your own routine, do not use it in production before customizing.


# donate to the developer
```
doge: DEj13YitqbqkWAidQVMHe6KHpgJeVP34jN
trx: TQcnz9wGdgneLbrMjYpNRVCKnDhuMAxGvD
waves: 3PQA4gjdQJcSzHhxZLbdhoWjkjrFEXmTqqw
bat: 0xCc5204F6998905194CA4f723E68DEEDADba74D30
xlm: GDMLY74MMFWAVPZYR2FRJ5TQPOMIHIHUCKTH64ZI3UOX3VEGS3UDCQED
btc: 1BrKxKsspVs3uR1ctAPfudLY38Tdw6yU3R
```
