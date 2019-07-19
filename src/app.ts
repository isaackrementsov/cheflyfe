import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as redis from 'redis';
import * as session from 'express-session';
import * as randomKey from 'random-key';

import ejs from 'ejs';

const client = redis.createClient();
const app = express();
const SESSION_SECRET = randomKey.generate();

const RedisStore = require('connect-redis')(session);

app.set('port', process.env.PORT || 300);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new RedisStore({
        client: client,
        host: 'localhost',
        port: 6379,
    })
}));
app.use(express.static(path.join(__dirname, "../public")));


export default app;
