import {Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToMany, JoinTable} from 'typeorm';
import Ingredient from './Ingredient';
import Recipe from './Recipe';
import Menu from './Menu';
import Post from './Post';
import Comment from './Comment';

//TODO: Add timestamps for admin analytics
@Entity()
export default class User {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    admin : boolean;
    @Column()
    password : string;
    @Column('text')
    bio : string = "I'm a new user to ChefLyfe!";
    @Column()
    avatar : string;
    @Column()
    background : string = '';
    @Column()
    system : 'metric' | 'imperial';
    @Column()
    currency : string;
    @Column()
    timestamp : Date = new Date();
    @Column('simple-json')
    name : {first: string, last: string};

    @Index({unique: true})
    @Column()
    email : string;
    @Index({unique: true})
    @Column()
    username : string

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

    @ManyToMany(type => User)
    @JoinTable()
    brigade : User[];
    @ManyToMany(type => User)
    @JoinTable()
    requested : User[];

    constructor(user : Partial<User>){
        Object.assign(this, user);
    }

}
