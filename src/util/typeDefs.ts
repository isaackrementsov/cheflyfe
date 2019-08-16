import {Repository, getRepository} from 'typeorm';
import Recipe from '../entity/Recipe';
import Ingredient from '../entity/Ingredient';
import User from '../entity/User';

export type DBCategory = 'recipe' | 'user' | 'post' | 'ingredient' | 'menu' | 'session';

export type PricePerUnit = {val : number, qt : number, units : string};
export type Costs = {labor: number, overhead: number, misc: number};
export type UnitQt = {qt: number, units: string};
export type Info = {allergens: boolean, profitMargin: boolean, profit: boolean, price: boolean, labor: boolean, overhead: boolean, misc: boolean, food: boolean};
export type PaymentInfo = {creditCardNumber: number};

export class RecipeSearcher {
    author : User;
    recipeRepo : Repository<Recipe>;
    ingredientRepo : Repository<Ingredient>;

    async transferRecipe(pop: Recipe) : Promise<Recipe> {
        let ingredients = pop.ingredients;
        let subs = pop.subRecipes;

        delete pop['id'];
        pop.author = this.author;
        pop.timestamp = new Date();
        pop.ingredients = [];
        pop.subRecipes = [];

        pop = await this.recipeRepo.save(pop);

        for(let ingredient of ingredients){ //TODO: prevent subrecipe deletion
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

                pop.ingredients.push(await this.ingredientRepo.save(ingredient));
            }
        }

        if(subs){
            for(let sub of subs){
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
