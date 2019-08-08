import {getRepository, Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinTable} from 'typeorm';
import {UnitQt, PricePerUnit, Costs, Info} from '../util/typeDefs';
import {money} from '../util/mathUtils';
import Menu from './Menu';
import Ingredient from './Ingredient';
import NutritionalInfo from './NutritionalInfo';
import User from './User';

//TODO: disable all unit inputs
@Entity()
export default class Recipe {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    name : string;
    @Column('text')
    description : string;
    @Column()
    feed : boolean;
    @Column()
    timestamp : Date = new Date();
    @Column('simple-array')
    steps : string[];
    @Column('simple-array')
    filePaths : string[]; //Limit to 6
    @Column('simple-json')
    price : PricePerUnit;
    @Column('simple-json')
    costs : Costs;
    @Column('simple-json')
    quantities : UnitQt[];
    @Column('simple-json')
    recipeQuantities : UnitQt[];
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
    @JoinTable()
    ingredients : Ingredient[];
    @ManyToMany(type => Recipe)
    @JoinTable()
    subRecipes : Recipe[];
    @ManyToOne(type => User, user => user.recipes)
    author : User;

    private sumCosts : number;

    foodCost : number;
    profit : number;
    profitMargin : number;
    nutritionalInfo : NutritionalInfo;
    allergens : string[];

    async getRelations(){
        let ingredientRepo = getRepository(Ingredient);

        this.ingredients = await ingredientRepo.createQueryBuilder('ingredient')
            .leftJoinAndSelect('ingredient.nutritionalInfo', 'nutritionalInfo')
            .where('recipeId = :id', {id: this.id})
            .getMany();
    }

    async getFoodCost(){
        let sum = 0;

        for(let i = 0; i < this.ingredients.length; i++){
            let ingredient = this.ingredients[i];
            sum += ingredient.price.val * ingredient.unitConvert(this.quantities[i]);
        }

        for(let i = 0; i < this.subRecipes.length; i++){
            let subRecipe = this.subRecipes[i];
            await subRecipe.getRelations();
            await subRecipe.getFoodCost();
            sum += this.foodCost;
        }

        this.foodCost = money(sum);
    }

    getSumCosts(){
        this.sumCosts = this.foodCost + this.costs.labor + this.costs.misc + this.costs.overhead;
    }

    getProfit(){
        this.profit = this.price.val - this.sumCosts;
    }

    getProfitMargin(){
        this.profitMargin = this.price.val == 0 ?  0 : money(100 * this.profit / this.price.val);
    }

    async getNutritionalInfo(){
        let n : NutritionalInfo = new NutritionalInfo({
            cholesterol: 0,
            sodium: 0,
            protein: 0,
            carbohydrates: {total: 0, fiber: 0, sugar: 0},
            calories: {total: 0, fromFat: 0},
            fat: {total: 0, saturated: 0, trans: 0}
        });

        for(let i = 0; i < this.ingredients.length; i++){
            let ingredient = this.ingredients[i];

            if(ingredient.nutritionalInfo){
                Object.keys(ingredient.nutritionalInfo).map(key => {
                    if(typeof n[key] == 'number'){
                        n[key] += ingredient.nutritionalInfo[key] * ingredient.unitConvert(this.quantities[i]);
                    }else if(typeof n[key] == 'object'){
                        Object.keys(n[key]).map(key2 => {
                            n[key][key2] += ingredient.nutritionalInfo[key][key2] * ingredient.unitConvert(this.quantities[i]);
                        });
                    }
                });
            }else{
                n = null;
                break;
            }
        }

        for(let i = 0; i < this.subRecipes.length; i++){
            let subRecipe = this.subRecipes[i];
            await subRecipe.getRelations();
            await subRecipe.getNutritionalInfo();

            if(subRecipe.nutritionalInfo){
                Object.keys(subRecipe.nutritionalInfo).map(key => {
                    if(typeof n[key] == 'number'){
                        n[key] += subRecipe.nutritionalInfo[key] * this.quantities[i].qt / subRecipe.price.qt;
                    }else{
                        Object.keys(n[key]).map(key2 => {
                            n[key][key2] += subRecipe.nutritionalInfo[key][key2] * this.recipeQuantities[i].qt / subRecipe.price.qt;
                        });
                    }
                });
            }else{
                n = null;
                break;
            }
        }

        this.nutritionalInfo = n;
    }

    async getAllergens(){
        this.allergens = [];

        for(let ingredient of this.ingredients){
            for(let allergen of ingredient.allergens){
                if(this.allergens.indexOf(allergen) == -1){
                    this.allergens.push(allergen);
                }
            }
        }

        for(let subRecipe of this.subRecipes){
            await subRecipe.getAllergens();

            for(let allergen of subRecipe.allergens){
                if(this.allergens.indexOf(allergen) == -1){
                    this.allergens.push(allergen);
                }
            }
        }
    }

    async getAllIngredients(){
        if(!this.ingredients) this.ingredients = [];

        for(let recipe of this.subRecipes){
            recipe.getRelations();
            recipe.getAllIngredients();
            this.ingredients.concat(recipe.ingredients);
        }
    }

    async populateInfo(){
        await this.getFoodCost();
        this.getSumCosts();
        this.getProfit();
        this.getProfitMargin();
        await this.getNutritionalInfo();
        await this.getAllergens();
    }

    constructor(recipe : Partial<Recipe>){
        Object.assign(this, recipe);
    }

}
