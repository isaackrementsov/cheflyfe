import { createConnection } from 'typeorm';
import app from './app';
import routes from './server/routes';

import Middleware from './util/Middleware';

createConnection().then(async connection => {
    if(app.get('env') == 'development'){
        await connection.synchronize();
    }

    let middleware : Middleware = new Middleware(); //Middleware (and anything that might deal with DB) should be initialized after DB connects

    app.use(middleware.auth);
    app.use(middleware.multipart);
    app.use(middleware.checkBody);
    app.use(middleware.checkParams);
    app.use(middleware.errorHandler);

    app.listen(app.get('port'), () => {
        console.log('App is running on localhost:%d in %s mode', app.get('port'), app.get('env'));
        console.log('Press CTRL + C to stop');
    });

    routes(app);
}).catch(e => console.log('Database Error: ', e));
