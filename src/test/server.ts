let Busboy = require('busboy');
//let app = require('express')();
let http = require('http');
http.createServer((req, res) => {
    if(req.method == 'POST'){
        let busboy = new Busboy({headers: req.headers});
        busboy.on('field', function(key, val){
            console.log('field');
        });
        busboy.on('file', function(){
            console.log('file');
        });
        busboy.on('finish', function(){
            console.log('finish');
            res.writeHead(303, {Connection: 'close', Location: '/'});
            res.end();
        });
        req.pipe(busboy);
    }else if(req.method == 'GET'){
        res.writeHead(200, {Connection: 'close'});
        res.end('<html><head></head><body>\
               <form method="POST" enctype="multipart/form-data">\
                <input type="text" name="textfield"><br />\
                <input type="file" name="filefield"><br />\
                <input type="submit">\
              </form>\
            </body></html>');
    }
}).listen(300, () => {
    console.log('Test server started');
});
/*app.listen(300, () => {
    console.log('Test server started');
});
app.get('/', (req, res) => {
    res.send(`
        <form class="login-form" method="POST" action="/fileUpload" enctype="multipart/form-data">
            <input type="text" name="stuff">
            <input type="file" name="avatar">
            <input type="submit">
        </form>
    `);
});
app.post('/fileUpload', (req, res) => {
    let busboy = new Busboy({headers: req.headers});
    busboy.on('field', function(key, val){
        console.log('field');
    });
    busboy.on('file', function(){
        console.log('file');
    });
    busboy.on('finish', function(){
        console.log('finish');
        res.end();
    });
});*/
