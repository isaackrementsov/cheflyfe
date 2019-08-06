"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var typeorm_1 = require("typeorm");
var path = require("path");
var shortId = require("shortid");
var fs = require("fs");
var Busboy = require("busboy");
var Comment_1 = require("../entity/Comment");
var Ingredient_1 = require("../entity/Ingredient");
var Menu_1 = require("../entity/Menu");
var NutritionalInfo_1 = require("../entity/NutritionalInfo");
var Post_1 = require("../entity/Post");
var Recipe_1 = require("../entity/Recipe");
var User_1 = require("../entity/User");
//Check for errors when converting params, JSON, relational, file delete
var Middleware = /** @class */ (function () {
    function Middleware() {
        var _this = this;
        this.multipart = function (req, res, next) {
            if (req.headers['content-type']) {
                if (req.headers['content-type'].indexOf('multipart/form-data') != -1) {
                    var fields_1 = {};
                    var maxFiles_1 = 1;
                    var fileCount_1 = 0;
                    var currentField_1 = '';
                    var busboy = new Busboy({ headers: req.headers });
                    req.pipe(busboy);
                    busboy.on('field', function (key, val) {
                        req.body[key] = val;
                    });
                    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                        if (fieldname.indexOf('Multi') != -1) {
                            if (currentField_1 != fieldname) {
                                var max = fieldname[fieldname.indexOf('Multi') + 5];
                                fileCount_1 = 0;
                                if (!isNaN(parseInt(max)))
                                    maxFiles_1 = parseInt(max);
                                else
                                    maxFiles_1 = -1;
                            }
                        }
                        if ((fileCount_1 <= maxFiles_1 || maxFiles_1 == -1) && filename) {
                            fileCount_1++;
                            var ext = filename.split('.')[filename.split('.').length - 1];
                            var saveTo = path.join(__dirname, '../../public/img/upload/' + (req.body.username || shortId.generate()) + '.' + ext);
                            var obj = { path: saveTo.replace(/\\/g, '/').split('/public')[1] };
                            if (maxFiles_1 != 1) {
                                fields_1[fieldname] ? fields_1[fieldname].push(obj) : fields_1[fieldname] = [obj];
                            }
                            else {
                                fields_1[fieldname] = obj;
                            }
                            file.pipe(fs.createWriteStream(saveTo));
                        }
                        else {
                            file.emit('close');
                            file.emit('end');
                        }
                    });
                    busboy.on('finish', function () {
                        if (Object.keys(fields_1).length > 0) {
                            req.files = fields_1;
                        }
                        next();
                    });
                }
                else {
                    next();
                }
            }
            else {
                next();
            }
        };
        this.checkParams = function (req, res, next) {
            var invalid = false;
            for (var key in req.params) {
                if (key == 'id') {
                    invalid = isNaN(req.params.id);
                    if (invalid)
                        break;
                }
            }
            _this.sendBack(req, res, next, invalid);
        };
        //Checks empty fields, auto parses and populates special fields
        this.checkBody = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var invalid, _a, _b, _i, key, id, cleanKey, obj, objs;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        invalid = false;
                        _a = [];
                        for (_b in req.body)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 33];
                        key = _a[_i];
                        if (key.indexOf('Opt') == -1 && req.body[key] == '') {
                            if (req.method == 'PATCH') {
                                delete req.body[key];
                            }
                            else {
                                invalid = true;
                                return [3 /*break*/, 33];
                            }
                        }
                        if (key.indexOf('JSON') != -1 && req.body[key] != '') {
                            try {
                                req.body[key] = JSON.parse(req.body[key]);
                            }
                            catch (e) {
                                invalid = true;
                            }
                        }
                        if (!(key.indexOf('Rel') != -1)) return [3 /*break*/, 32];
                        id = req.body[key];
                        cleanKey = key.trim().toLowerCase();
                        if (!(typeof id == 'number' || typeof id == 'string')) return [3 /*break*/, 16];
                        if (typeof id == 'string')
                            id = parseInt(id);
                        obj = void 0;
                        if (!(cleanKey.indexOf('comment') != -1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.commentRepo.find(id)];
                    case 2:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 3:
                        if (!cleanKey.indexOf('ingredient')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.ingredientRepo.findOne(id)];
                    case 4:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 5:
                        if (!cleanKey.indexOf('menu')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.menuRepo.findOne(id)];
                    case 6:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 7:
                        if (!cleanKey.indexOf('nutritionalInfo')) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.nutritionalInfoRepo.findOne(id)];
                    case 8:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 9:
                        if (!cleanKey.indexOf('post')) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.postRepo.findOne(id)];
                    case 10:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 11:
                        if (!cleanKey.indexOf('recipe')) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.recipeRepo.findOne(id)];
                    case 12:
                        obj = _c.sent();
                        return [3 /*break*/, 15];
                    case 13:
                        if (!cleanKey.indexOf('user')) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.userRepo.findOne(id)];
                    case 14:
                        obj = _c.sent();
                        _c.label = 15;
                    case 15:
                        req.body[key] = obj;
                        return [3 /*break*/, 32];
                    case 16:
                        if (!(id.constructor == Array)) return [3 /*break*/, 31];
                        objs = void 0;
                        if (!(cleanKey.indexOf('comment') != -1)) return [3 /*break*/, 18];
                        return [4 /*yield*/, this.commentRepo.findByIds(id)];
                    case 17:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 18:
                        if (!(cleanKey.indexOf('ingredient') != -1)) return [3 /*break*/, 20];
                        return [4 /*yield*/, this.ingredientRepo.findByIds(id)];
                    case 19:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 20:
                        if (!(cleanKey.indexOf('menu') != -1)) return [3 /*break*/, 22];
                        return [4 /*yield*/, this.menuRepo.findByIds(id)];
                    case 21:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 22:
                        if (!(cleanKey.indexOf('nutritionalInfo') != -1)) return [3 /*break*/, 24];
                        return [4 /*yield*/, this.nutritionalInfoRepo.findByIds(id)];
                    case 23:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 24:
                        if (!(cleanKey.indexOf('post') != -1)) return [3 /*break*/, 26];
                        return [4 /*yield*/, this.postRepo.findByIds(id)];
                    case 25:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 26:
                        if (!(cleanKey.indexOf('recipe') != -1)) return [3 /*break*/, 28];
                        return [4 /*yield*/, this.recipeRepo.findByIds(id)];
                    case 27:
                        objs = _c.sent();
                        return [3 /*break*/, 30];
                    case 28:
                        if (!(cleanKey.indexOf('user') != -1 || key.indexOf('requested') != -1 || key.indexOf('brigade') != -1)) return [3 /*break*/, 30];
                        return [4 /*yield*/, this.userRepo.findByIds(id)];
                    case 29:
                        objs = _c.sent();
                        _c.label = 30;
                    case 30:
                        req.body[key] = objs;
                        return [3 /*break*/, 32];
                    case 31:
                        invalid = true;
                        _c.label = 32;
                    case 32:
                        _i++;
                        return [3 /*break*/, 1];
                    case 33:
                        this.sendBack(req, res, next, invalid);
                        return [2 /*return*/];
                }
            });
        }); };
        this.auth = function (req, res, next) {
            var adminRestricted = req.url.indexOf('/admin') != -1;
            var userRestricted = !(req.url == '/' || req.url == '/login' || req.url == '/signup' || req.url.indexOf('/css/') != -1 || req.url.indexOf('/js/') != -1 || req.url.indexOf('/img/') != -1);
            if ((adminRestricted && req.session.admin) || (userRestricted && req.session.userID) || (!userRestricted && !req.session.userID)) {
                next();
            }
            else if ((adminRestricted && !req.session.admin) || (userRestricted && !req.session.userID)) {
                res.redirect('/login');
            }
            else if (!userRestricted && req.session.userID) {
                res.redirect('/users/' + req.session.userID);
            }
        };
        this.errorHandler = function (err, req, res, next) {
            _this.sendBack(req, res, next, true, err);
        };
        this.commentRepo = typeorm_1.getRepository(Comment_1.default);
        this.ingredientRepo = typeorm_1.getRepository(Ingredient_1.default);
        this.menuRepo = typeorm_1.getRepository(Menu_1.default);
        this.nutritionalInfoRepo = typeorm_1.getRepository(NutritionalInfo_1.default);
        this.postRepo = typeorm_1.getRepository(Post_1.default);
        this.recipeRepo = typeorm_1.getRepository(Recipe_1.default);
        this.userRepo = typeorm_1.getRepository(User_1.default);
    }
    Middleware.prototype.sendBack = function (req, res, next, condition, err) {
        if (condition) {
            req.session.error = err ? err.stack : 'Invalid input';
            res.redirect(req.header('Referer') || '/');
        }
        else
            next();
    };
    Middleware.decodeBody = function (body, files) {
        var decoded = {};
        for (var key in body) {
            if (key.indexOf('Meta') == -1) {
                var finalKey = key.replace('Opt', '').replace('Rel', '').replace('JSON', '');
                decoded[finalKey] = body[key];
            }
        }
        if (files) {
            for (var key in files) {
                var finalKey = key.replace('Multi', '').replace('Upl', '').replace(/\d+/, '');
                decoded[finalKey] = files[key].length ? files[key].map(function (f) { return f.path; }) : files[key].path;
            }
        }
        return decoded;
    };
    return Middleware;
}());
exports.default = Middleware;
//# sourceMappingURL=Middleware.js.map