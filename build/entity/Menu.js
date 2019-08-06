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
var User_1 = require("./User");
var Menu = /** @class */ (function () {
    function Menu(menu) {
        Object.assign(this, menu);
    }
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Menu.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Menu.prototype, "logo", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Menu.prototype, "header", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Menu.prototype, "info", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], Menu.prototype, "sharingPermissions", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return User_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Menu.prototype, "sharedUsers", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return Recipe_1.default; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Menu.prototype, "recipes", void 0);
    __decorate([
        typeorm_1.ManyToOne(function (type) { return User_1.default; }, function (user) { return user.menus; }),
        __metadata("design:type", User_1.default)
    ], Menu.prototype, "author", void 0);
    Menu = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], Menu);
    return Menu;
}());
exports.default = Menu;
//# sourceMappingURL=Menu.js.map