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
Object.defineProperty(exports, "__esModule", { value: true });
var typeorm_1 = require("typeorm");
var Recipe_1 = require("./Recipe");
var NutritionalInfo_1 = require("./NutritionalInfo");
var User_1 = require("./User");
var Ingredient = /** @class */ (function () {
    function Ingredient(ingredients) {
        Object.assign(this, ingredients);
    }
    Ingredient.prototype.unitConvert = function (initial) {
        var factor = this.conversions.concat([this.price]).find(function (c) { return c.units == initial.units; });
        if (factor)
            return initial.qt / factor.qt;
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Ingredient.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Ingredient.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Ingredient.prototype, "brand", void 0);
    __decorate([
        typeorm_1.Column('text'),
        __metadata("design:type", String)
    ], Ingredient.prototype, "description", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Ingredient.prototype, "wastage", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Ingredient.prototype, "price", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Array)
    ], Ingredient.prototype, "conversions", void 0);
    __decorate([
        typeorm_1.Column('simple-array'),
        __metadata("design:type", Array)
    ], Ingredient.prototype, "allergens", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return Recipe_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Ingredient.prototype, "recipes", void 0);
    __decorate([
        typeorm_1.OneToOne(function (type) { return NutritionalInfo_1.default; }, function (n) { return n.ingredient; }, { cascade: true, nullable: true }),
        typeorm_1.JoinColumn(),
        __metadata("design:type", NutritionalInfo_1.default)
    ], Ingredient.prototype, "nutritionalInfo", void 0);
    __decorate([
        typeorm_1.ManyToOne(function (type) { return User_1.default; }, function (user) { return user.ingredients; }),
        __metadata("design:type", User_1.default)
    ], Ingredient.prototype, "author", void 0);
    Ingredient = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], Ingredient);
    return Ingredient;
}());
exports.default = Ingredient;
//# sourceMappingURL=Ingredient.js.map