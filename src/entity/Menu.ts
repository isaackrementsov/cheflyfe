import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {Info} from '../util/typeDefs';
import Recipe from './Recipe';
import User from './User';
import Ingredient from './Ingredient';

@Entity()
export default class Menu {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column()
    logo : string;
    @Column('simple-json')
    sharingPermissions : Info;

    @ManyToMany(type => User)
    @JoinTable()
    sharedUsers : User[];
    @ManyToMany(type => Recipe)
    @JoinTable()
    recipes : Recipe[];

    @ManyToOne(type => User, user => user.menus)
    author : User;

    ingredients : Ingredient[];

    async getAllIngredients(){
        this.ingredients = [];

        for(let recipe of this.recipes){
            recipe.getRelations();
            recipe.getAllIngredients();
            this.ingredients.concat(recipe.ingredients);
        }
    }

    constructor(menu : Partial<Menu>){
        Object.assign(this, menu);
    }

}
