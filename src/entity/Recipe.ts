import {getRepository, Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, OneToOne, JoinTable} from 'typeorm';
import {UnitQt, PricePerUnit, Costs, Info, Rating} from '../util/typeDefs';
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
    showServingCost : boolean;
    @Column()
    showTotalCost : boolean;
    @Column()
    showPortionPrice : boolean;
    @Column()
    showPortionProfit : boolean;
    @Column()
    serves : number;
    @Column({nullable: true})
    from : number;
    @Column()
    timestamp : Date = new Date();
    @Column('simple-array')
    filePaths : string[]; //Limit to 6
    @Column('simple-json')
    steps : string[];
    @Column('simple-json')
    price : PricePerUnit;
    @Column('simple-json')
    costs : Costs;
    @Column('simple-json')
    quantities : UnitQt[];
    @Column('simple-json')
    recipeQuantities : UnitQt[];
    @Column('simple-json')
    ratings : Rating[] = [];
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

    @ManyToMany(type => Menu, menu => menu.recipes)
    menus : Menu[];
    @ManyToMany(type => User)
    @JoinTable()
    sharedUsers : User[];
    @ManyToMany(type => Ingredient, ingredient => ingredient.recipes)
    @JoinTable()
    ingredients : Ingredient[];
    @ManyToMany(type => Recipe)
    @JoinTable()
    subRecipes : Recipe[];
    @ManyToOne(type => User, user => user.recipes)
    author : User;

    private sumCosts : number;

    foodCost : number;
    servingCost : number;
    profit : number;
    profitMargin : number;
    nutritionalInfo : NutritionalInfo;
    allergens : string[];
    subRecipeIngredients : string[];
    transferID : number;

    async getRelations(){
        let recipeRepo = getRepository(Recipe);

        let self : Recipe = await recipeRepo.createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.ingredients', 'ingredients')
            .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
            .leftJoinAndSelect('ingredients.nutritionalInfo', 'ingredients_nutritionalInfo')
            .where('recipe.id = :id', {id: this.id})
            .getOne();

        this.ingredients = self.ingredients || [];
        this.subRecipes = self.subRecipes || [];
    }

    async getFoodCost(){
        let sum = 0;

        for(let i = 0; i < this.ingredients.length; i++){
            let ingredient = this.ingredients[i];

            sum += ingredient.price.val * ingredient.unitConvert(this.quantities[i]) / (1 - ingredient.wastage/100);
        }

        for(let subRecipe of this.subRecipes){
            await subRecipe.getRelations();
            await subRecipe.getFoodCost();

            sum += subRecipe.foodCost;
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

    getServingCost(){
        this.servingCost = this.sumCosts / this.serves;
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
                        n[key] += subRecipe.nutritionalInfo[key] * this.recipeQuantities[i].qt / subRecipe.price.qt;
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

    async getAllIngredientsSTD(){
        if(!this.subRecipes) this.subRecipes = [];
        this.subRecipeIngredients = [];

        for(let i = 0; i < this.subRecipes.length; i++){
            let subRecipe = this.subRecipes[i];

            await subRecipe.getRelations();
            await subRecipe.getAllIngredients();

            for(let k = 0; k < subRecipe.ingredients.length; k++){
                let ingredient = subRecipe.ingredients[k].name;

                if(this.subRecipeIngredients.indexOf(ingredient) == -1){
                    this.subRecipeIngredients.push(ingredient);
                }
            }
        }
    }

    async getAllIngredients(){
        if(!this.ingredients) this.ingredients = [];
        if(!this.subRecipes) this.subRecipes = [];

        for(let k = 0; k < this.ingredients.length; k++){
            let ingredient = this.ingredients[k];
            let price = money(ingredient.price.val * ingredient.unitConvert(this.quantities[k]));
            let qt = money(ingredient.price.qt * ingredient.unitConvert(this.quantities[k]));

            this.ingredients[k].price.val = price;
            this.ingredients[k].price.qt = qt;
        }

        for(let i = 0; i < this.subRecipes.length; i++){
            let subRecipe = this.subRecipes[i];
            let rqt = this.recipeQuantities[i].qt;

            await subRecipe.getRelations();
            await subRecipe.getAllIngredients();

            for(let k = 0; k < subRecipe.ingredients.length; k++){
                let ingredient = subRecipe.ingredients[k];
                let idx = this.ingredients.map(i => i.id).indexOf(ingredient.id);
                let price = money(rqt * ingredient.price.val);
                let qt = money(rqt * ingredient.price.qt);

                if(idx == -1){
                    ingredient.price.val = price;
                    ingredient.price.qt = qt;
                    this.ingredients.push(ingredient);
                }else{
                    this.ingredients[idx].price.val += price;
                    this.ingredients[idx].price.qt += qt;
                }
            }
        }
    }

    async populateInfo(){
        if(!this.ingredients) this.ingredients = [];
        if(!this.subRecipes) this.subRecipes = [];

        await this.getFoodCost();
        this.getSumCosts();
        this.getProfit();
        this.getProfitMargin();
        this.getServingCost();
        await this.getNutritionalInfo();
        await this.getAllergens();
        await this.getAllIngredientsSTD();
    }

    constructor(recipe : Partial<Recipe>){
        Object.assign(this, recipe);
    }

}
