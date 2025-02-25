import * as reflect from 'reflect-metadata';
import * as methodOverride from 'method-override';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as redis from 'redis';
import * as session from 'express-session';
import * as flash from 'connect-flash-plus';

import ejs from 'ejs';

const client = redis.createClient();
const app = express();
const SESSION_SECRET = require('../config.json').secret;

const RedisStore = require('connect-redis')(session);

app.set('port', 3000);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    cookie: {
        maxAge: 3600000
    },
    store: new RedisStore({
        client: client,
        host: 'localhost',
        port: 6379,
    })
}));
app.use(express.static(path.join(__dirname, "../public")));
app.use(methodOverride('_method'));
app.use(flash());

export default app;
