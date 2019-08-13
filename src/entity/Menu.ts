import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {Info} from '../util/typeDefs';
import {money} from '../util/mathUtils';
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
    @Column()
    timestamp : Date = new Date();
    @Column('simple-json')
    sharingPermissions : Info;

    @ManyToMany(type => User)
    @JoinTable()
    sharedUsers : User[];
    @ManyToMany(type => Recipe, recipe => recipe.menus)
    @JoinTable()
    recipes : Recipe[];

    @ManyToOne(type => User, user => user.menus)
    author : User;

    ingredients : Ingredient[];
    allergens : string[];

    async getAllIngredients(){
        this.ingredients = [];

        for(let recipe of this.recipes){
            await recipe.getRelations();
            await recipe.getAllIngredients();

            for(let k = 0; k < recipe.ingredients.length; k++){
                let ingredient = recipe.ingredients[k];
                let idx = this.ingredients.indexOf(ingredient);

                if(idx == -1){
                    this.ingredients.push(ingredient);
                }else{
                    this.ingredients[idx].price.val += ingredient.price.val;
                    this.ingredients[idx].price.qt += ingredient.price.qt;
                }
            }
        }
    }

    async getAllAllergens(){
        this.allergens = [];

        for(let recipe of this.recipes){
            await recipe.getAllergens()

            for(let allergen of recipe.allergens){
                if(this.allergens.indexOf(allergen) == -1){
                    this.allergens.push(allergen);
                }
            }
        }
    }

    constructor(menu : Partial<Menu>){
        Object.assign(this, menu);
    }

}
