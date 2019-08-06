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
var Recipe_1 = require("../entity/Recipe");
var User_1 = require("../entity/User");
var Middleware_1 = require("../util/Middleware");
var fs = require("fs");
//TODO: maybe fix create method?
var RecipeController = /** @class */ (function () {
    function RecipeController() {
        var _this = this;
        this.getIndex = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var recipe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.recipeRepo.createQueryBuilder('recipe')
                            .leftJoinAndSelect('recipe.ingredients', 'ingredients')
                            .leftJoinAndSelect('ingredients.nutritionalInfo', 'ingredients_nutritionalInfo')
                            .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
                            .leftJoinAndSelect('recipe.menus', 'menus')
                            .leftJoinAndSelect('recipe.author', 'author')
                            .leftJoinAndSelect('author.ingredients', 'author_ingredients')
                            .leftJoinAndSelect('author.recipes', 'author_recipes')
                            .leftJoinAndSelect('author.brigade', 'author_brigade')
                            .leftJoinAndSelect('recipe.sharedUsers', 'shared')
                            .where('shared.id = :userID OR author.id = :userID', { userID: req.session.userID })
                            .andWhere('recipe.id = :id', { id: parseInt(req.params.id) })
                            .getOne()];
                    case 1:
                        recipe = _a.sent();
                        if (!recipe) return [3 /*break*/, 3];
                        return [4 /*yield*/, recipe.populateInfo()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        res.render(recipe ? 'recipe' : 'notFound', { recipe: recipe, session: req.session });
                        return [2 /*return*/];
                }
            });
        }); };
        this.getAll = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var recipes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.recipeRepo.createQueryBuilder('recipe')
                            .leftJoinAndSelect('recipe.sharedUsers', 'sharedUsers')
                            .where('authorId = :userID OR sharedUsers.id = :userID', { userID: req.session.userID })
                            .getMany()];
                    case 1:
                        recipes = _a.sent();
                        res.render('recipes', { recipes: recipes, session: req.session });
                        return [2 /*return*/];
                }
            });
        }); };
        this.getCreate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepo.findOne(req.session.userID, {
                            relations: ['ingredients', 'recipes', 'brigade']
                        })];
                    case 1:
                        user = _a.sent();
                        res.render('createRecipe', { session: req.session, user: user });
                        return [2 /*return*/];
                }
            });
        }); };
        this.postCreate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var recipe, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = Recipe_1.default.bind;
                        _b = {
                            name: req.body.name,
                            description: req.body.descriptionOpt || 'no description',
                            steps: req.body.stepsJSON,
                            filePaths: req.files['recipeUplMulti6'].map(function (f) { return f.path; }),
                            price: { val: req.body.priceJSON, qt: req.body.qtJSON, units: req.body.units },
                            costs: { labor: req.body.laborJSON, overhead: req.body.overheadJSON, misc: req.body.miscJSON },
                            quantities: req.body.quantitiesJSON,
                            recipeQuantities: req.body.recipeQuantitiesJSON,
                            ingredients: req.body.ingredientsRelJSON,
                            subRecipes: req.body.recipesRelJSON,
                            sharedUsers: req.body.sharedUsersRelJSON,
                            sharingPermissions: {
                                allergens: req.body.allergensShareJSON || false,
                                profitMargin: req.body.profitMarginShareJSON || false,
                                profit: req.body.profitShareJSON || false,
                                price: req.body.priceShareJSON || false,
                                labor: req.body.laborShareJSON || false,
                                misc: req.body.miscShareJSON || false,
                                food: req.body.foodShareJSON || false,
                                overhead: req.body.overheadShareJSON || false
                            },
                            feed: req.body.postShareJSON || false
                        };
                        return [4 /*yield*/, this.userRepo.findOne(req.session.userID)];
                    case 1:
                        recipe = new (_a.apply(Recipe_1.default, [void 0, (_b.author = _c.sent(),
                                _b)]))();
                        return [4 /*yield*/, this.recipeRepo.save(recipe)];
                    case 2:
                        _c.sent();
                        res.redirect('/recipes/' + this.recipeRepo.getId(recipe));
                        return [2 /*return*/];
                }
            });
        }); };
        this.patchUpdate = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var update, toUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update = Middleware_1.default.decodeBody(req.body, req.files);
                        return [4 /*yield*/, this.recipeRepo.createQueryBuilder()
                                .select()
                                .where('authorId = :userID AND id = :id', {
                                userID: req.session.userID,
                                id: parseInt(req.params.id)
                            })
                                .getOne()];
                    case 1:
                        toUpdate = _a.sent();
                        if (!toUpdate) return [3 /*break*/, 3];
                        if (update['recipe']) {
                            toUpdate.filePaths.push(update['recipe']);
                        }
                        else {
                            Object.assign(toUpdate, update);
                            if (req.body.deletedMeta != '' && req.body.deletedMeta) {
                                try {
                                    fs.unlinkSync(req.body.deletedMeta);
                                }
                                catch (e) { }
                            }
                        }
                        return [4 /*yield*/, this.recipeRepo.save(toUpdate)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        res.redirect('/recipes/' + req.params.id);
                        return [2 /*return*/];
                }
            });
        }); };
        this.delete = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.recipeRepo.createQueryBuilder()
                            .delete()
                            .where('authorId = :userID AND id = :id', {
                            userID: req.session.userID,
                            id: parseInt(req.params.id)
                        })
                            .execute()];
                    case 1:
                        _a.sent();
                        res.redirect('/recipes');
                        return [2 /*return*/];
                }
            });
        }); };
        this.recipeRepo = typeorm_1.getRepository(Recipe_1.default);
        this.userRepo = typeorm_1.getRepository(User_1.default);
    }
    return RecipeController;
}());
exports.default = RecipeController;
//# sourceMappingURL=RecipeController.js.map