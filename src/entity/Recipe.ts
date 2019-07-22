import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {UnitQt, PricePerUnit, Costs} from '../util/typeDefs';
import Menu from './Menu';
import Ingredient from './Ingredient';
import NutritionalInfo from './NutritionalInfo';
import User from './User';

export default class Recipe {

    @PrimaryGeneratedColumn()
    id : number;

    @ManyToMany(type => Menu)
    menus : Menu[];

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

    constructor(
        @Column('simple-json') public price : PricePerUnit,
        @Column('simple-json') public costs : Costs,
        @Column('simple-json') public quantities : UnitQt[],
        @ManyToMany(type => Ingredient) @JoinTable() public ingredients : Ingredient[],
        @ManyToMany(type => Recipe) @JoinTable() public subRecipes : Recipe[],
        @ManyToOne(type => User, user => user.recipes) public author : User
    ){}

}
