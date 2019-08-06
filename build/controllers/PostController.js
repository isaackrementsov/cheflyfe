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
var Post_1 = require("../entity/Post");
var User_1 = require("../entity/User");
var Comment_1 = require("../entity/Comment");
var Middleware_1 = require("../util/Middleware");
var fs = require("fs");
//TODO: set page for errors, make error messages more common, handle promise rejection
var PostController = /** @class */ (function () {
    function PostController() {
        var _this = this;
        this.getAll = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepo.findOne(parseInt(req.params.id), {
                            relations: ['brigade', 'requested', 'posts', 'posts.author', 'posts.comments', 'posts.comments.author', 'recipes', 'recipes.sharedUsers'],
                        })];
                    case 1:
                        user = _a.sent();
                        res.render(user ? 'user' : 'notFound', { user: user, posts: user.posts, session: req.session });
                        return [2 /*return*/];
                }
            });
        }); };
        this.postCreate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var post, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = Post_1.default.bind;
                        _b = {
                            name: req.body.name,
                            content: req.body.contentOptional,
                            filePaths: req.files ? req.files['postUplMulti8'].map(function (p) { return p.path; }) : []
                        };
                        return [4 /*yield*/, this.userRepo.findOne(req.session.userID)];
                    case 1:
                        post = new (_a.apply(Post_1.default, [void 0, (_b.author = _c.sent(),
                                _b.comments = [],
                                _b)]))();
                        return [4 /*yield*/, this.postRepo.save(post)];
                    case 2:
                        _c.sent();
                        res.redirect('/users/' + req.session.userID);
                        return [2 /*return*/];
                }
            });
        }); };
        this.patchUpdate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var update, toUpdate, comment, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        update = Middleware_1.default.decodeBody(req.body, req.files);
                        if (!(typeof update['filePaths'] == 'string' || update['addedComment'] != '')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.postRepo.createQueryBuilder('post')
                                .select()
                                .leftJoinAndSelect('post.comments', 'comment')
                                .where('post.authorId = :userID AND post.id = :id', {
                                userID: typeof update['filePaths'] == 'string' ? req.session.userID : parseInt(req.query.userID),
                                id: parseInt(req.params.id)
                            })
                                .getOne()];
                    case 1:
                        toUpdate = _c.sent();
                        if (!toUpdate) return [3 /*break*/, 6];
                        if (!(typeof update['filePaths'] == 'string')) return [3 /*break*/, 2];
                        toUpdate.filePaths.push(update['filePaths']);
                        return [3 /*break*/, 4];
                    case 2:
                        _a = Comment_1.default.bind;
                        _b = {};
                        return [4 /*yield*/, this.userRepo.findOne(req.session.userID)];
                    case 3:
                        comment = new (_a.apply(Comment_1.default, [void 0, (_b.author = _c.sent(),
                                _b.content = update['addedComment'],
                                _b)]))();
                        toUpdate.comments ? toUpdate.comments.push(comment) : toUpdate.comments = [comment];
                        _c.label = 4;
                    case 4: return [4 /*yield*/, this.postRepo.save(toUpdate)];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.postRepo.createQueryBuilder()
                            .update().set(update)
                            .where('authorId = :userID AND id = :id', {
                            userID: req.session.userID,
                            id: parseInt(req.params.id)
                        })
                            .execute()];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9:
                        if (req.body.deletedMeta != '' && req.body.deletedMeta) {
                            try {
                                fs.unlinkSync(__dirname + '/../../public' + req.body.deletedMeta);
                            }
                            catch (e) { }
                        }
                        res.redirect('/users/' + req.query.userID);
                        return [2 /*return*/];
                }
            });
        }); };
        this.delete = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepo.createQueryBuilder()
                            .delete()
                            .where('authorId = :userID AND id = :id', {
                            userID: req.session.userID,
                            id: parseInt(req.params.id)
                        })
                            .execute()];
                    case 1:
                        _a.sent();
                        res.redirect('/users/' + req.session.userID);
                        return [2 /*return*/];
                }
            });
        }); };
        this.postRepo = typeorm_1.getRepository(Post_1.default);
        this.userRepo = typeorm_1.getRepository(User_1.default);
        this.commentRepo = typeorm_1.getRepository(Comment_1.default);
    }
    return PostController;
}());
exports.default = PostController;
//# sourceMappingURL=PostController.js.map