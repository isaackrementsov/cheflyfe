import HomeController from '../controllers/HomeController';
import IngredientController from '../controllers/IngredientController';
import MenuController from '../controllers/MenuController';
import PostController from '../controllers/PostController';
import RecipeController from '../controllers/RecipeController';
import UserController from '../controllers/UserController';

//TODO: Make url params integers for ids in controllers
let routes = app => {
    let homeController : HomeController = new HomeController();
    let ingredientController : IngredientController = new IngredientController();
    let menuController : MenuController = new MenuController();
    let postController : PostController = new PostController();
    let recipeController : RecipeController = new RecipeController();
    let userController : UserController = new UserController();

    app.get('/', homeController.getIndex);
    app.get('/login', userController.getLogin);
    app.get('/signup', userController.getSignup)
    app.get('/ingredients', ingredientController.getAll);
    app.get('/menus', menuController.getAll);
    app.get('/menus/:id', menuController.getIndex);
    app.get('/users/:id', postController.getAll);
    app.get('/recipes', recipeController.getAll);
    app.get('/recipes/create', recipeController.getCreate);
    app.get('/recipes/:id', recipeController.getIndex);

    app.post('/login', userController.postLogin);
    app.post('/signup', userController.postSignup);
    app.post('/logout', userController.postLogout);
    app.post('/ingredients/create', ingredientController.postCreate);
    app.post('/menus/create', menuController.postCreate);
    app.post('/posts/create', postController.postCreate);
    app.post('/recipes/create', recipeController.postCreate);

    app.patch('/users/update', userController.patchUpdate);
    app.patch('/ingredients/update/:id', ingredientController.patchUpdate);
    app.patch('/menus/update/:id', menuController.patchUpdate);
    app.patch('/posts/update/:id', postController.patchUpdate);
    app.patch('/recipes/update/:id', recipeController.patchUpdate);

    app.delete('/users/delete', userController.delete);
    app.delete('/ingredients/delete/:id', ingredientController.delete);
    app.delete('/menus/delete/:id', menuController.delete);
    app.delete('/posts/delete/:id', postController.delete);
    app.delete('/recipes/delete/:id', recipeController.delete);
}

export default routes;
