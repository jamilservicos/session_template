"use strict";

/*
to guarantee a quick response, the sessions are kept in memory, and recorded in the database as a backup.
*/

const Session = require('./lib/sessions/fn_session'); //session class for requests
const Store = require('./lib/store/memory/fn_memory'); //memory class of the all requests
const DataBase = require('./lib/store/database/fn_mongo'); //I will use mongo as an example database to guarantee sessions after restarting the server.
const localStore = Object.assign({}); //object responsible for local memory
const memoryStore = new Store(localStore); //pointing the object to the class responsible for managing memory
/*
localStore = records;
memoryStore = cache sessions;
DataBase = restart persistence;
*/

exports = module.exports = config => {
  const options = config; // variable to guarantee the availability of information immutably, so it needs to be "const"
  const dbloader = new DataBase(options.config.session, memoryStore); //starting the database, calling the memory manager and the settings for session encryption.
  
  return (req, res, next) => {
    /* 
    if it is a request, it will be passed to this return. 
    remembering that I'm using restify as an example, adjusting requests for the server I use
    */
    const requrl = req.href().toString().toLowerCase(); // get url of request
    if(requrl.startsWith("/assets")) return next(); //assets async fix;
    if (requrl === "/favicon.ico") {
      res.status(204);
      return res.end();
    } // if it's a favicon, I'll come back with 204 and avoid using the session unnecessarily.
    
    if (req.session) return next(); // if there was already a session started, I skip the startup routine.
    
    req.session = new Session(req, memoryStore); //I initialize the session by sending the request and pointing the memory manager.
    /*
    then I call the “restore” that will read the cookie, check if the session already exists in memory and restore with the latest changes.
    If there is no active session, a new session will be created.
    And save the new cookie.
    */
    const restore = req.session.restore({
      session: options.config.session,
      cookie: options.config.cookie
    }, next);
    if (restore) {
      if (restore.serial) res.setHeader('Set-Cookie', restore.serial); // cookie atualizado ou novo cookie.
      return next();
    }
    
  };
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
