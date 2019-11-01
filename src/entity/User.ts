import {Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToMany, JoinTable} from 'typeorm';
import Ingredient from './Ingredient';
import Recipe from './Recipe';
import Menu from './Menu';
import Post from './Post';
import Comment from './Comment';
import * as shortId from 'shortid';

let config = require('../../config.json');

//TODO: Add timestamps for admin analytics
@Entity()
export default class User {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    admin : boolean;
    @Column()
    hasUsedFreeTrial : boolean = false;
    @Column()
    emailPending : boolean = true;
    @Column()
    paymentStatus : string = 'PENDING';
    @Column()
    paymentNotRequired : boolean = false;
    @Column('text')
    bio : string = "I'm a new user to ChefLyfe!";
    @Column()
    avatar : string;
    @Column()
    authKey : string = shortId.generate();
    @Column()
    paymentKey : string = '';
    @Column()
    background : string = '';
    @Column()
    system : 'metric' | 'imperial';
    @Column()
    currency : string;
    @Column({nullable: true})
    businessText : string;
    @Column({nullable: true})
    businessLogo : string;
    @Column({nullable: true})
    tempPassword : string;
    @Column()
    timestamp : Date = new Date();
    @Column({nullable: true})
    expires : Date = null;
    @Column('simple-json')
    name : {first: string, last: string};

    @Index({unique: true})
    @Column()
    email : string;
    @Index({unique: true})
    @Column()
    username : string;

    /*@Column(<ExtendedColumnOptions>{
        encrypt: {
            key: 'd85117047fd06d3afa79b6e44ee3a52eb426fc24c3a2e3667732e8da0342b4da',
            algorithm: 'aes-256-ctr',
            ivLength: 16
        }
    })*/
    @Column()
    password : string;

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
