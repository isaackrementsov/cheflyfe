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
var User_1 = require("./User");
var Comment_1 = require("./Comment");
//TODO: convert all long strings to @Column('text')
var Post = /** @class */ (function () {
    function Post(post) {
        this.likes = 0;
        this.timestamp = new Date();
        Object.assign(this, post);
    }
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column('text'),
        __metadata("design:type", String)
    ], Post.prototype, "content", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Post.prototype, "likes", void 0);
    __decorate([
        typeorm_1.Column('simple-array'),
        __metadata("design:type", Array)
    ], Post.prototype, "filePaths", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Date)
    ], Post.prototype, "timestamp", void 0);
    __decorate([
        typeorm_1.OneToMany(function (type) { return Comment_1.default; }, function (comment) { return comment.post; }, { cascade: true }),
        __metadata("design:type", Array)
    ], Post.prototype, "comments", void 0);
    __decorate([
        typeorm_1.ManyToOne(function (type) { return User_1.default; }, function (user) { return user.posts; }),
        __metadata("design:type", User_1.default)
    ], Post.prototype, "author", void 0);
    Post = __decorate([
        typeorm_1.Entity(),
        __metadata("design:paramtypes", [Object])
    ], Post);
    return Post;
}());
exports.default = Post;
//# sourceMappingURL=Post.js.map