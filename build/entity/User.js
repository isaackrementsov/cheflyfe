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
var Recipe_1 = require("./Recipe");
var Menu_1 = require("./Menu");
var Post_1 = require("./Post");
var Comment_1 = require("./Comment");
//TODO: Add timestamps for admin analytics
var User = /** @class */ (function () {
    function User(user) {
        this.bio = "I'm a new user to ChefLyfe!";
        this.background = '';
        Object.assign(this, user);
    }
    User_1 = User;
    var User_1;
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Boolean)
    ], User.prototype, "admin", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], User.prototype, "password", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], User.prototype, "email", void 0);
    __decorate([
        typeorm_1.Column('text'),
        __metadata("design:type", String)
    ], User.prototype, "bio", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], User.prototype, "avatar", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], User.prototype, "background", void 0);
    __decorate([
        typeorm_1.Column('simple-json'),
        __metadata("design:type", Object)
    ], User.prototype, "name", void 0);
    __decorate([
        typeorm_1.Index({ unique: true }),
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], User.prototype, "username", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Ingredient_1.default; }, function (ingredient) { return ingredient.author; }),
        __metadata("design:type", Array)
    ], User.prototype, "ingredients", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Recipe_1.default; }, function (recipe) { return recipe.author; }),
        __metadata("design:type", Array)
    ], User.prototype, "recipes", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Menu_1.default; }, function (menu) { return menu.author; }),
        __metadata("design:type", Array)
    ], User.prototype, "menus", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Post_1.default; }, function (post) { return post.author; }),
        __metadata("design:type", Array)
    ], User.prototype, "posts", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Comment_1.default; }, function (comment) { return comment.author; }),
        __metadata("design:type", Array)
    ], User.prototype, "comments", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return User_1; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], User.prototype, "brigade", void 0);
    __decorate([
        typeorm_1.ManyToMany(function (type) { return User_1; }),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], User.prototype, "requested", void 0);
    User = User_1 = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], User);
    return User;
}());
exports.default = User;
//# sourceMappingURL=User.js.map