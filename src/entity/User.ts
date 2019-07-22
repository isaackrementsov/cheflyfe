import {Entity, Column, PrimaryGeneratedColumn, Index, OneToMany} from 'typeorm';
import Ingredient from './Ingredient';
import Recipe from './Recipe';
import Menu from './Menu';
import Post from './Post';
import Comment from './Comment';

@Entity()
export default class User {

    @PrimaryGeneratedColumn()
    id : number;

    @OneToMany(type => Ingredient, ingredient => ingredient.author)
    ingredients : Ingredient[];
    @OneToMany(type => Recipe, recipe => recipe.author)
    recipes : Recipe[];
    @OneToMany(type => Menu, menu => menu.author)
    menus : Menu[];
    @OneToMany(type => Post, post => post.author)
    posts : Post[];
    @OneToMany(type => Comment, comment => comment.author)
    comments : Comment[];

    constructor(
        @Column() public admin : boolean,
        @Column() public password : string,
        @Column() public email : string,
        @Column('simple-json') public name : {first: string, last: string},
        @Column() @Index({unique: true}) public username : string
    ){}

}
