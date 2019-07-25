import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {UnitQt, PricePerUnit, Costs, Info} from '../util/typeDefs';
import Menu from './Menu';
import Ingredient from './Ingredient';
import NutritionalInfo from './NutritionalInfo';
import User from './User';

@Entity()
export default class Recipe {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column()
    description : string;
    @Column('simple-array')
    steps : string[];
    @Column('simple-array')
    images : string[]; //Limit to 6
    @Column('simple-json')
    price : PricePerUnit;
    @Column('simple-json')
    costs : Costs;
    @Column('simple-json')
    quantities : UnitQt[];
    @Column('simple-json')
    sharingPermissions : Info = {
        allergens: false,
        profitMargin: false,
        profit: false,
        price: false,
        labor: false,
        overhead: false,
        misc: false,
        food: false
    };

    @ManyToMany(type => Menu)
    @JoinTable()
    menus : Menu[];
    @ManyToMany(type => User)
    @JoinTable()
    sharedUsers : User[];
    @ManyToMany(type => Ingredient)
    @JoinTable() public ingredients : Ingredient[];
    @ManyToMany(type => Recipe)
    @JoinTable() public subRecipes : Recipe[];
    @ManyToOne(type => User, user => user.recipes)
    public author : User;

    foodCost() : number {
        let sum = 0;

        for(let i = 0; i < this.ingredients.length; i++){
            let ing : Ingredient = this.ingredients[i];
            sum += ing.unitConvert(this.quantities[i])*ing.price.val;
        }

        return sum;
    }

    sumCosts() : number {
        return this.foodCost() + this.costs.labor + this.costs.misc + this.costs.overhead;
    }

    profit() : number {
        return this.price.val - this.sumCosts();
    }

    profitMargin() : number {
        return this.profit() / this.price.val;
    }

    nutritionalInfo() : NutritionalInfo {
        return new NutritionalInfo({}); //Finish this later
    }

    constructor(recipe : Partial<Recipe>){
        Object.assign(this, recipe);
    }

}
