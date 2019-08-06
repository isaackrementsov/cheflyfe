"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var methodOverride = require("method-override");
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var redis = require("redis");
var session = require("express-session");
var randomKey = require("random-key");
var client = redis.createClient();
var app = express();
var SESSION_SECRET = randomKey.generate();
var RedisStore = require('connect-redis')(session);
app.set('port', process.env.PORT || 300);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
app.use(methodOverride('_method'));
exports.default = app;
//# sourceMappingURL=app.js.map