import {Repository, getRepository} from 'typeorm';
import {imperialUnits, metricUnits, conversions} from './conversions';
import {money} from './mathUtils';
import {promisify} from 'util';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';
import * as fs from 'fs';

export type DBCategory = 'recipe' | 'user' | 'post' | 'ingredient' | 'menu' | 'session';

export type PricePerUnit = {val : number, qt : number, units : string};
export type Costs = {labor: number, overhead: number, misc: number};
export type UnitQt = {qt: number, units: string};
export type Info = {allergens: boolean, profitMargin: boolean, profit: boolean, price: boolean, labor: boolean, overhead: boolean, misc: boolean, food: boolean};
export type PaymentInfo = {creditCardNumber: number};
export type PurchaseRecord = {val: number, timestamp: Date};
export type Rating = {userID: number, val: number};

export const unlink = promisify(fs.unlink);

export class RecipeSearcher {
    author : User;
    recipeRepo : Repository<Recipe>;
    ingredientRepo : Repository<Ingredient>;

    private createPredicate(unit: string) : (u: string) => boolean {
        return u => u == unit.trim().toLowerCase();
    }

    private getIndexContains(arr: string[], arr2 : string[], units: string) : number {
        return arr.indexOf(arr2.find(this.createPredicate(units)));
    }

    convertSystem(price) : any {
        let system = this.author.system;

        if(system == 'imperial'){
            let mU = metricUnits.indexOf(price.units.trim().toLowerCase());

            if(mU != -1){
                price.units = price.units.replace(metricUnits[mU], imperialUnits[mU]);
                price.qt = money(price.qt / conversions[mU]);
            }
        }else{
            let iU = imperialUnits.indexOf(price.units.trim().toLowerCase());

            if(iU != -1){
                price.units = price.units.replace(imperialUnits[iU], metricUnits[iU]);
                price.qt = money(conversions[iU] * price.qt);
            }
        }

        return price;
    }

    getUnits(price) : string {
        let system = this.author.system;

        if(system == 'imperial'){
            let mU = metricUnits.indexOf(price.units.trim().toLowerCase());

            if(mU != -1){
                return price.units.replace(metricUnits[mU], imperialUnits[mU]);
            }
        }else{
            let iU = imperialUnits.indexOf(price.units.trim().toLowerCase());

            if(iU != -1){
                return price.units.replace(imperialUnits[iU], metricUnits[iU]);
            }
        }

        return '';
    }

    async transferRecipe(pop: Recipe) : Promise<Recipe> {
        let ingredients = pop.ingredients;
        let quantities = pop.quantities;
        let subs = pop.subRecipes;
        let recipeQuantities = pop.recipeQuantities;

        pop.from = pop.id;
        delete pop['id'];
        pop.credit = pop.author ? pop.author.username : null;
        pop.author = this.author;
        pop.price = this.convertSystem(pop.price);
        pop.timestamp = new Date();
        pop.ingredients = [];
        pop.quantities = [];
        pop.subRecipes = [];
        pop.recipeQuantities = [];
        pop.ratings = [];
        pop.sharedUsers = [];

        pop = await this.recipeRepo.save(pop);

        for(let i = 0; i < ingredients.length; i++){
            let ingredient = ingredients[i];
            let matched : Ingredient[] = await this.ingredientRepo.createQueryBuilder('ingredient')
                .leftJoinAndSelect('ingredient.author', 'author')
                .where('author.id = :userID AND ingredient.name = :name', {userID: this.author.id, name: ingredient.name})
                .getMany();

            let final : Ingredient;

            for(let ing of matched){
                if(ing.price.units == this.getUnits(ingredient.price)){
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
                ingredient.price = this.convertSystem(ingredient.price);
                ingredient.conversions = ingredient.conversions.map(c => {
                    return this.convertSystem(c);
                });

                if(ingredient.nutritionalInfo){
                    delete ingredient.nutritionalInfo['id'];
                }

                pop.ingredients.push(await this.ingredientRepo.save(ingredient));
            }

            pop.quantities.push(this.convertSystem(quantities[i]));
        }

        if(subs){
            for(let i = 0; i < subs.length; i++){
                let sub = subs[i];
                let matched : Recipe[] = await this.recipeRepo.createQueryBuilder('recipe')
                    .leftJoinAndSelect('recipe.author', 'author')
                    .where('author.id = :userID AND (recipe.name = :name or recipe.from = :subID)', {userID: this.author.id, name: sub.name, subID: sub.id})
                    .getMany();

                let final : Recipe;

                for(let rec of matched){
                    if(rec.price.units == this.getUnits(sub.price)){
                        final = rec;
                        break;
                    }
                }

                if(final){
                    pop.subRecipes.push(final);
                }else{
                    sub = await this.recipeRepo.createQueryBuilder('recipe')
                        .leftJoinAndSelect('recipe.ingredients', 'ingredients')
                        .leftJoinAndSelect('ingredients.nutritionalInfo', 'ingredients_nutritionalInfo')
                        .leftJoinAndSelect('recipe.subRecipes', 'subRecipes')
                        .where('recipe.id = :id', {id: sub.id})
                        .getOne();

                    pop.subRecipes.push(await this.transferRecipe(sub));
                }

                pop.recipeQuantities.push(this.convertSystem(recipeQuantities[i]));
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
