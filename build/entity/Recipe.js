"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
var mathUtils_1 = require("../util/mathUtils");
var Menu_1 = require("./Menu");
var Ingredient_1 = require("./Ingredient");
var NutritionalInfo_1 = require("./NutritionalInfo");
var User_1 = require("./User");
//TODO: disable all unit inputs
var Recipe = /** @class */ (function () {
    function Recipe(recipe) {
        this.timestamp = new Date();
        this.sharingPermissions = {
            allergens: false,
            profitMargin: false,
            profit: false,
            price: false,
            labor: false,
            overhead: false,
            misc: false,
            food: false
        };
        Object.assign(this, recipe);
    }
    Recipe_1 = Recipe;
    Recipe.prototype.getRelations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ingredientRepo, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ingredientRepo = typeorm_1.getRepository(Ingredient_1.default);
                        _a = this;
                        return [4 /*yield*/, ingredientRepo.createQueryBuilder('ingredient')
                                .leftJoinAndSelect('ingredient.nutritionalInfo', 'nutritionalInfo')
                                .where('recipeId = :id', { id: this.id })
                                .getMany()];
                    case 1:
                        _a.ingredients = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Recipe.prototype.getFoodCost = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sum, i, ingredient, i, subRecipe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sum = 0;
                        for (i = 0; i < this.ingredients.length; i++) {
                            ingredient = this.ingredients[i];
                            sum += ingredient.price.val * ingredient.unitConvert(this.quantities[i]);
                        }
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.subRecipes.length)) return [3 /*break*/, 5];
                        subRecipe = this.subRecipes[i];
                        return [4 /*yield*/, subRecipe.getRelations()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, subRecipe.getFoodCost()];
                    case 3:
                        _a.sent();
                        sum += this.foodCost;
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5:
                        this.foodCost = mathUtils_1.money(sum);
                        return [2 /*return*/];
                }
            });
        });
    };
    Recipe.prototype.getSumCosts = function () {
        this.sumCosts = this.foodCost + this.costs.labor + this.costs.misc + this.costs.overhead;
    };
    Recipe.prototype.getProfit = function () {
        this.profit = this.price.val - this.sumCosts;
    };
    Recipe.prototype.getProfitMargin = function () {
        this.profitMargin = this.price.val == 0 ? 0 : mathUtils_1.money(100 * this.profit / this.price.val);
    };
    Recipe.prototype.getNutritionalInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var n, _loop_1, this_1, i, state_1, _loop_2, this_2, i, state_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        n = new NutritionalInfo_1.default({
                            cholesterol: 0,
                            sodium: 0,
                            protein: 0,
                            carbohydrates: { total: 0, fiber: 0, sugar: 0 },
                            calories: { total: 0, fromFat: 0 },
                            fat: { total: 0, saturated: 0, trans: 0 }
                        });
                        _loop_1 = function (i) {
                            var ingredient = this_1.ingredients[i];
                            if (ingredient.nutritionalInfo) {
                                Object.keys(ingredient.nutritionalInfo).map(function (key) {
                                    if (typeof n[key] == 'number') {
                                        n[key] += ingredient.nutritionalInfo[key] * ingredient.unitConvert(_this.quantities[i]);
                                    }
                                    else if (typeof n[key] == 'object') {
                                        Object.keys(n[key]).map(function (key2) {
                                            n[key][key2] += ingredient.nutritionalInfo[key][key2] * ingredient.unitConvert(_this.quantities[i]);
                                        });
                                    }
                                });
                            }
                            else {
                                n = null;
                                return "break";
                            }
                        };
                        this_1 = this;
                        for (i = 0; i < this.ingredients.length; i++) {
                            state_1 = _loop_1(i);
                            if (state_1 === "break")
                                break;
                        }
                        _loop_2 = function (i) {
                            var subRecipe;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        subRecipe = this_2.subRecipes[i];
                                        return [4 /*yield*/, subRecipe.getRelations()];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, subRecipe.getNutritionalInfo()];
                                    case 2:
                                        _a.sent();
                                        if (subRecipe.nutritionalInfo) {
                                            Object.keys(subRecipe.nutritionalInfo).map(function (key) {
                                                if (typeof n[key] == 'number') {
                                                    n[key] += subRecipe.nutritionalInfo[key] * _this.quantities[i].qt / subRecipe.price.qt;
                                                }
                                                else {
                                                    Object.keys(n[key]).map(function (key2) {
                                                        n[key][key2] += subRecipe.nutritionalInfo[key][key2] * _this.recipeQuantities[i].qt / subRecipe.price.qt;
                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            n = null;
                                            return [2 /*return*/, "break"];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.subRecipes.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_2(i)];
                    case 2:
                        state_2 = _a.sent();
                        if (state_2 === "break")
                            return [3 /*break*/, 4];
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.nutritionalInfo = n;
                        return [2 /*return*/];
                }
            });
        });
    };
    Recipe.prototype.getAllergens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, ingredient, _b, _c, allergen, _d, _e, subRecipe, _f, _g, allergen;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        this.allergens = [];
                        for (_i = 0, _a = this.ingredients; _i < _a.length; _i++) {
                            ingredient = _a[_i];
                            for (_b = 0, _c = ingredient.allergens; _b < _c.length; _b++) {
                                allergen = _c[_b];
                                if (this.allergens.indexOf(allergen) == -1) {
                                    this.allergens.push(allergen);
                                }
                            }
                        }
                        _d = 0, _e = this.subRecipes;
                        _h.label = 1;
                    case 1:
                        if (!(_d < _e.length)) return [3 /*break*/, 4];
                        subRecipe = _e[_d];
                        return [4 /*yield*/, subRecipe.getAllergens()];
                    case 2:
                        _h.sent();
                        for (_f = 0, _g = subRecipe.allergens; _f < _g.length; _f++) {
                            allergen = _g[_f];
                            if (this.allergens.indexOf(allergen) == -1) {
                                this.allergens.push(allergen);
                            }
                        }
                        _h.label = 3;
                    case 3:
                        _d++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Recipe.prototype.populateInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getFoodCost()];
                    case 1:
                        _a.sent();
                        this.getSumCosts();
                        this.getProfit();
                        this.getProfitMargin();
                        return [4 /*yield*/, this.getNutritionalInfo()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.getAllergens()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    var Recipe_1;
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Recipe.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Recipe.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column('text'),
        __metadata("design:type", String)
    ], Recipe.prototype, "description", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Boolean)
    ], Recipe.prototype, "feed", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Date)
    ], Recipe.prototype, "timestamp", void 0);
    __decorate([
        typeorm_1.Column('simple-array'),
        __metadata("design:type", Array)
    ], Recipe.prototype, "steps", void 0);
    __decorate([
        typeorm_1.Column('simple-array'),
        __metadata("design:type", Array)
    ], Recipe.prototype, "filePaths", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Recipe.prototype, "price", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Recipe.prototype, "costs", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Array)
    ], Recipe.prototype, "quantities", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Array)
    ], Recipe.prototype, "recipeQuantities", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Recipe.prototype, "sharingPermissions", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return Menu_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Recipe.prototype, "menus", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return User_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Recipe.prototype, "sharedUsers", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return Ingredient_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Recipe.prototype, "ingredients", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return Recipe_1; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Recipe.prototype, "subRecipes", void 0);
    __decorate([
        typeorm_1.ManyToOne(function (type) { return User_1.default; }, function (user) { return user.recipes; }),
        __metadata("design:type", User_1.default)
    ], Recipe.prototype, "author", void 0);
    Recipe = Recipe_1 = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], Recipe);
    return Recipe;
}());
exports.default = Recipe;
//# sourceMappingURL=Recipe.js.map