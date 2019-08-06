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
var User_1 = require("../entity/User");
var Middleware_1 = require("../util/Middleware");
var fs = require("fs");
/*TODO:
    * Add payment & subscription
*/
var UserController = /** @class */ (function () {
    function UserController() {
        var _this = this;
        this.getLogin = function (req, res) {
            req.session.page = 'login';
            res.render('login', { session: req.session });
        };
        this.getSignup = function (req, res) {
            req.session.page = 'signup';
            res.render('login', { session: req.session });
        };
        this.postLogin = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepo.findOne({
                            'username': req.body.username,
                            'password': req.body.password
                        })];
                    case 1:
                        user = _a.sent();
                        if (user) {
                            req.session.username = user.username;
                            req.session.userID = user.id;
                            req.session.admin = user.admin;
                            req.session.avatar = user.avatar;
                            req.session.error = null;
                            res.redirect('/users/' + user.id);
                        }
                        else {
                            req.session.error = 'Invalid credentials';
                            res.redirect('/login');
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.postSignup = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = new User_1.default({
                            admin: false,
                            password: req.body.password,
                            email: req.body.email,
                            avatar: req.files['avatarUpl'].path,
                            name: { first: req.body.first, last: req.body.last },
                            username: req.body.username
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.userRepo.save(user)];
                    case 2:
                        _a.sent();
                        req.session.error = null;
                        this.postLogin(req, res);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        req.session.error = 'Username must be unique';
                        res.redirect('/signup');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.postLogout = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, req.session.destroy(function () { })];
                    case 1:
                        _a.sent();
                        res.redirect('/login');
                        return [2 /*return*/];
                }
            });
        }); };
        this.patchUpdate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var update, toUpdate, toUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update = Middleware_1.default.decodeBody(req.body, req.files);
                        if (!(update['requested'] || update['brigade'])) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.userRepo.findOne(req.query.id ? parseInt(req.query.id) : req.session.userID)];
                    case 1:
                        toUpdate = _a.sent();
                        if (update['requested'])
                            toUpdate.requested = update['requested'];
                        if (update['brigade'])
                            toUpdate.brigade = update['brigade'];
                        return [4 /*yield*/, this.userRepo.save(toUpdate)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 3:
                        if (!req.files) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.userRepo.findOne(req.session.userID, { select: ['background', 'avatar'] })];
                    case 4:
                        toUpdate = _a.sent();
                        try {
                            if (update['avatar']) {
                                fs.unlinkSync(__dirname + '/../../public' + toUpdate.avatar);
                            }
                            if (update['background']) {
                                fs.unlinkSync(__dirname + '/../../public' + toUpdate.background);
                            }
                        }
                        catch (e) { }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.userRepo.update(req.session.userID, update)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        res.redirect('/users/' + (req.query.id || req.session.userID));
                        return [2 /*return*/];
                }
            });
        }); };
        this.delete = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepo.delete(req.session.userID)];
                    case 1:
                        _a.sent();
                        res.redirect('/login');
                        return [2 /*return*/];
                }
            });
        }); };
        this.userRepo = typeorm_1.getRepository(User_1.default);
    }
    return UserController;
}());
exports.default = UserController;
//# sourceMappingURL=UserController.js.map