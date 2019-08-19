import {Repository, getRepository} from 'typeorm';
import {imperialUnits, metricUnits, conversions} from './conversions';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import { money } from './mathUtils';

export type DBCategory = 'recipe' | 'user' | 'post' | 'ingredient' | 'menu' | 'session';

export type PricePerUnit = {val : number, qt : number, units : string};
export type Costs = {labor: number, overhead: number, misc: number};
export type UnitQt = {qt: number, units: string};
export type Info = {allergens: boolean, profitMargin: boolean, profit: boolean, price: boolean, labor: boolean, overhead: boolean, misc: boolean, food: boolean};
export type PaymentInfo = {creditCardNumber: number};
export type PurchaseRecord = {val: number, timestamp: Date};
export type Rating = {userID: number, val: number};

export class RecipeSearcher {
    author : User;
    recipeRepo : Repository<Recipe>;
    ingredientRepo : Repository<Ingredient>;

    private createPredicate(unit: string) : (u: string) => boolean {
        return u => u.indexOf(unit) != -1;
    }

    private getIndexContains(arr: string[], units: string) : number {
        return arr.indexOf(imperialUnits.find(this.createPredicate(units)));
    }

    private convertSystem(system: string, price) : any {
        if(system == 'imperial'){
            let mU = this.getIndexContains(metricUnits, price.units);

            if(mU != -1){
                price.units = price.units.replace(metricUnits[mU], imperialUnits[mU]);
                price.qt = money(conversions[mU] / price.qt);
            }
        }else{
            let iU = this.getIndexContains(imperialUnits, price.units);

            if(iU != -1){
                price.units = price.units.replace(imperialUnits[iU], metricUnits[iU]);
                price.qt = money(conversions[iU] * price.qt);
            }
        }

        return price;
    }

    async transferRecipe(pop: Recipe) : Promise<Recipe> {
        let ingredients = pop.ingredients;
        let quantities = pop.quantities;
        let subs = pop.subRecipes;
        let recipeQuantities = pop.recipeQuantities;

        delete pop['id'];
        pop.author = this.author;
        pop.price = this.convertSystem(this.author.system, pop.price);
        pop.timestamp = new Date();
        pop.ingredients = [];
        pop.quantities = [];
        pop.subRecipes = [];
        pop.recipeQuantities = [];
        pop.ratings = [];

        pop = await this.recipeRepo.save(pop);

        for(let i = 0; i < ingredients.length; i++){ //TODO: prevent subrecipe deletion
            let ingredient = ingredients[i];
            let matched : Ingredient[] = await this.ingredientRepo.createQueryBuilder('ingredient')
                .leftJoinAndSelect('ingredient.author', 'author')
                .where('author.id = :userID AND ingredient.name = :name', {userID: this.author.id, name: ingredient.name})
                .getMany();

            let final : Ingredient;

            for(let ing of matched){
                if(ing.price.units == ingredient.price.units && ingredient.conversions.filter(c => ing.conversions.indexOf(c) == -1).length == 0){
                    final = ing;
                    break;
                }
            }

            if(final){
                pop.ingredients.push(final);
            }else{
                await this.ingredientRepo.save(ingredient);

                delete ingredient['id'];
                ingredient.author = this.author;
                ingredient.price = this.convertSystem(this.author.system, ingredient.price);
                ingredient.conversions = ingredient.conversions.map(c => {
                    return this.convertSystem(this.author.system, c);
                });

                pop.ingredients.push(await this.ingredientRepo.save(ingredient));
                pop.quantities.push(this.convertSystem(this.author.system, quantities[i]));
            }
        }

        if(subs){
            for(let i = 0; i < subs.length; i++){
                let sub = subs[i];
                let matched : Recipe[] = await this.recipeRepo.createQueryBuilder('recipe')
                    .leftJoinAndSelect('recipe.author', 'author')
                    .where('author.id = :userID AND recipe.name = :name', {userID: this.author.id, name: sub.name})
                    .getMany();

                let final : Recipe;

                for(let rec of matched){
                    if(rec.price.units == sub.price.units){
                        final = rec;
                        break;
                    }
                }

                if(final){
                    pop.subRecipes.push(sub);
                }else{
                    sub = await this.recipeRepo.createQueryBuilder('recipe')
                        .leftJoinAndSelect('recipe.ingredients', 'ingredients')
                        .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
                        .where('recipe.id = :id', {id: sub.id})
                        .getOne();

                    pop.subRecipes.push(await this.transferRecipe(sub));
                    pop.subRecipes.push(this.convertSystem(this.author.system, recipeQuantities[i]));
                }
            }
        }

        return await this.recipeRepo.save(pop);
    }

    static async createSearcher(authorId: string, partial: Partial<RecipeSearcher>) : Promise<RecipeSearcher> {
        let self = new RecipeSearcher();

        Object.assign(self, partial);
        self.author = await getRepository(User).findOne(authorId);

        return self;
    }
}
