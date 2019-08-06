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
var Ingredient_1 = require("./Ingredient");
var NutritionalInfo = /** @class */ (function () {
    function NutritionalInfo(nutritionalInfo) {
        Object.assign(this, nutritionalInfo);
    }
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], NutritionalInfo.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column('float'),
        __metadata("design:type", Number)
    ], NutritionalInfo.prototype, "cholesterol", void 0);
    __decorate([
        typeorm_1.Column('float'),
        __metadata("design:type", Number)
    ], NutritionalInfo.prototype, "sodium", void 0);
    __decorate([
        typeorm_1.Column('float'),
        __metadata("design:type", Number)
    ], NutritionalInfo.prototype, "protein", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], NutritionalInfo.prototype, "carbohydrates", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], NutritionalInfo.prototype, "calories", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], NutritionalInfo.prototype, "fat", void 0);
    __decorate([
        typeorm_1.OneToOne(function (type) { return Ingredient_1.default; }, function (i) { return i.nutritionalInfo; }),
        __metadata("design:type", Ingredient_1.default)
    ], NutritionalInfo.prototype, "ingredient", void 0);
    NutritionalInfo = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], NutritionalInfo);
    return NutritionalInfo;
}());
exports.default = NutritionalInfo;
//# sourceMappingURL=NutritionalInfo.js.map