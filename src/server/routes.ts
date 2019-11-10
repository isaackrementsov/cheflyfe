import HomeController from '../controllers/HomeController';
import IngredientController from '../controllers/IngredientController';
import MenuController from '../controllers/MenuController';
import PostController from '../controllers/PostController';
import RecipeController from '../controllers/RecipeController';
import UserController from '../controllers/UserController';
import AdminController from '../controllers/AdminController';
import PaymentController from '../controllers/PaymentController';

//TODO: Make url params integers for ids in controllers
let routes = app => {
    let homeController : HomeController = new HomeController();
    let ingredientController : IngredientController = new IngredientController();
    let menuController : MenuController = new MenuController();
    let postController : PostController = new PostController();
    let recipeController : RecipeController = new RecipeController();
    let userController : UserController = new UserController();
    let adminController : AdminController = new AdminController();
    let paymentController : PaymentController = new PaymentController();

    app.get('/', homeController.getIndex); //TODO: fix res.render({a: a}) -> res.render({a});
    app.get('/terms', homeController.getTerms);
    app.get('/privacy', homeController.getPrivacy);
    app.get('/how-tos', homeController.getHowTo);
    app.get('/pricing', homeController.getPricing);
    app.get('/login', userController.getLogin);
    app.get('/signup', userController.getSignup)
    app.get('/pending', userController.getPending);
    app.get('/verify', userController.getVerify);
    app.get('/reset', userController.getReset);
    app.get('/reset/confirm', userController.getFinishReset);
    app.get('/payment', paymentController.getPayment);
    app.get('/payment/signup/:id', paymentController.getSignup);
    app.get('/subscription', paymentController.getSubscription);
    app.get('/ingredients', ingredientController.getAll);
    app.get('/ingredients/export', ingredientController.getExport)
    app.get('/menus', menuController.getAll);
    app.get('/menus/create', menuController.getCreate);
    app.get('/menus/public', menuController.getPublic);
    app.get('/menus/:id', menuController.getIndex);
    app.get('/menus/pdf/:id', menuController.getPDF);
    app.get('/news', postController.getPublic);
    app.get('/news/:id', postController.getPublicIndex);
    app.get('/users/search', userController.getSearchAll)
    app.get('/users/:id', postController.getAll);
    app.get('/recipes', recipeController.getAll);
    app.get('/recipes/create', recipeController.getCreate);
    app.get('/recipes/public', recipeController.getPublic);
    app.get('/recipes/:id', recipeController.getIndex);
    app.get('/recipes/pdf/:id', recipeController.getPDF);
    app.get('/admin', adminController.getIndex);
    app.get('/admin/exportEmails', adminController.getExportEmails);

    app.post('/login', userController.postLogin);
    app.post('/signup', userController.postSignup);
    app.post('/admin/signup', userController.postAdminSignup)
    app.post('/logout', userController.postLogout);
    app.post('/reset', userController.postSendResetEmail);
    app.post('/reverify', userController.postReverify);
    app.post('/ingredients/create', ingredientController.postCreate);
    app.post('/ingredients/createCSV', ingredientController.postCreateCSV);
    app.post('/menus/create', menuController.postCreate);
    app.post('/posts/create', postController.postCreate);
    app.post('/recipes/create', recipeController.postCreate);
    app.post('/admin/upl', adminController.postUpl);
    app.post('/admin/howtos/create', adminController.postCreateHowTo);
    app.post('/payment/signup/:id', paymentController.postSignup);
    app.post('/subscription/cancel/:id', paymentController.postCancelSubscription);

    app.patch('/users/update', userController.patchUpdate);
    app.patch('/users/verify/update', userController.patchUpdateEmail);
    app.patch('/ingredients/update/:id', ingredientController.patchUpdate);
    app.patch('/menus/update/:id', menuController.patchUpdate);
    app.patch('/posts/update/:id', postController.patchUpdate);
    app.patch('/recipes/update/:id', recipeController.patchUpdate);
    app.patch('/admin/update', adminController.patchUpdate);
    app.patch('/admin/status/:id', adminController.patchPromoteDemote);
    app.patch('/admin/date/:id', adminController.patchDate);

    app.put('/recipes/transfer/:id', recipeController.putTransfer);
    app.put('/menus/transfer/:id', menuController.putTransfer);

    app.delete('/users/delete/:id', userController.delete);
    app.delete('/ingredients/delete/:id', ingredientController.delete);
    app.delete('/menus/delete/:id', menuController.delete);
    app.delete('/posts/delete/:id', postController.delete);
    app.delete('/recipes/delete/:id', recipeController.delete);
    app.delete('/admin/howtos/delete/:id', adminController.deleteHowTo);
}

export default routes;
