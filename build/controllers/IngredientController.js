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
var Ingredient_1 = require("../entity/Ingredient");
var User_1 = require("../entity/User");
var NutritionalInfo_1 = require("../entity/NutritionalInfo");
var Middleware_1 = require("../util/Middleware");
//TODO: add CSV ingredient batch uplaod, keywords, prep time, video?, add required to all non-optional inputs
var IngredientController = /** @class */ (function () {
    function IngredientController() {
        var _this = this;
        this.getAll = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var ingredients;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ingredientRepo.find({
                            where: { 'authorId': req.session.userID },
                            relations: ['author', 'recipes', 'nutritionalInfo'],
                        })];
                    case 1:
                        ingredients = _a.sent();
                        res.render('ingredients', { ingredients: ingredients, session: req.session });
                        return [2 /*return*/];
                }
            });
        }); };
        this.postCreate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var n, obj, invalid, ingredient, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        obj = {
                            calories: { total: req.body.calsOptJSON, fromFat: req.body.fatCalsOptJSON },
                            fat: { total: req.body.fatOptJSON, saturated: req.body.satFatOptJSON, trans: req.body.transFatOptJSON },
                            cholesterol: req.body.cholOptJSON,
                            sodium: req.body.sodOptJSON,
                            carbohydrates: { total: req.body.carbsOptJSON, fiber: req.body.fibOptJSON, sugar: req.body.sugOptJSON },
                            protein: req.body.protOptJSON
                        };
                        invalid = Object.keys(obj).filter(function (k) {
                            if (typeof obj[k] == 'object') {
                                var nestedInvalid = Object.keys(obj[k]).filter(function (j) {
                                    return (obj[k][j] == '' || obj[k][j] == undefined);
                                });
                                if (nestedInvalid.length > 0)
                                    return obj[k];
                            }
                            else {
                                return (obj[k] == '' || obj[k] == undefined);
                            }
                        });
                        if (invalid.length == 0) {
                            n = new NutritionalInfo_1.default({
                                calories: { total: req.body.calsOptJSON, fromFat: req.body.fatCalsOptJSON },
                                fat: { total: req.body.fatOptJSON, saturated: req.body.satFatOptJSON, trans: req.body.transFatOptJSON },
                                cholesterol: req.body.cholOptJSON,
                                sodium: req.body.sodOptJSON,
                                carbohydrates: { total: req.body.carbsOptJSON, fiber: req.body.fibOptJSON, sugar: req.body.sugOptJSON },
                                protein: req.body.protOptJSON
                            });
                        }
                        else {
                            n = null;
                        }
                        _a = Ingredient_1.default.bind;
                        _b = {
                            name: req.body.name,
                            description: req.body.descriptionOpt || 'no description',
                            brand: req.body.brandOpt || 'no brand',
                            wastage: req.body.wastageJSON,
                            price: { val: req.body.valJSON, qt: req.body.qtJSON, units: req.body.units },
                            conversions: req.body.conversionsJSON,
                            allergens: req.body.allergensJSON,
                            nutritionalInfo: n
                        };
                        return [4 /*yield*/, this.userRepo.findOne(req.session.userID)];
                    case 1:
                        ingredient = new (_a.apply(Ingredient_1.default, [void 0, (_b.author = _c.sent(),
                                _b)]))();
                        return [4 /*yield*/, this.ingredientRepo.save(ingredient)];
                    case 2:
                        _c.sent();
                        res.redirect('/ingredients');
                        return [2 /*return*/];
                }
            });
        }); };
        this.patchUpdate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var update;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update = Middleware_1.default.decodeBody(req.body);
                        return [4 /*yield*/, this.ingredientRepo.createQueryBuilder('ingredient')
                                .update().set(update)
                                .where('authorId = :userID AND id = :id', {
                                userID: req.session.userID,
                                id: parseInt(req.params.id)
                            })
                                .execute()];
                    case 1:
                        _a.sent();
                        res.redirect('/ingredients');
                        return [2 /*return*/];
                }
            });
        }); };
        this.delete = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ingredientRepo.createQueryBuilder()
                            .delete()
                            .where('authorId = :userID AND id = :id', {
                            userID: req.session.userID,
                            id: parseInt(req.params.id)
                        })
                            .execute()];
                    case 1:
                        _a.sent();
                        res.redirect('/ingredients');
                        return [2 /*return*/];
                }
            });
        }); };
        this.ingredientRepo = typeorm_1.getRepository(Ingredient_1.default);
        this.userRepo = typeorm_1.getRepository(User_1.default);
    }
    return IngredientController;
}());
exports.default = IngredientController;
//# sourceMappingURL=IngredientController.js.map