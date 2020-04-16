const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');
const morgan = require('morgan');
const multer = require('multer');
const crypto = require('crypto');

// creat a client

let client = redis.createClient({port:6379, host: "10.7.8.129"});

client.on('connect', ()=>{
    console.log('Connected to Redis');
})
// set port 

const port = 3000;

const app = express();


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){
        cb(null, crypto.createHash('sha1').update(new Date().toString()).digest('hex') + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // refect a file
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    }
    else{
        cb(null, true);
    }
};


const upload = multer({
    storage: storage,
    limit: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

const uploadHandler = (req, res, next) => {

    res.status(201).json({"message": "all good!"});
}

// View engine
app.use(morgan('dev'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, '/public')));
app.use('/uploads', express.static('/uploads'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// methodOverride
app.use(methodOverride('_method'));



app.get('/', (req, res, next)=> {

    res.render('searchusers');
});

app.post('/user/search', (req, res, next)=>{
    let id = req.body.id;
    client.hgetall(id, (err, obj)=>{
        if(!obj){
            res.render('searchusers', {
                error: 'User does not exist'
            });
        }
        else{
            obj.id = id;
            res.render('details', {
                user: obj
            })
        }
    });
});

app.get('/user/add', (req, res, next)=> {

    res.render('adduser');
});

app.get('/upload', (req, res, next)=>{
    res.render('dragndrop');
});

app.post('/upload', upload.array('file'), uploadHandler );
app.post('/user/add', (req, res, next)=> {


    let id = req.body.id;
    let fname = req.body.first_name;
    let lname = req.body.last_name;
    let email = req.body.email;
    let phone = req.body.phone;

    client.hmset(id, [
        'first_name', fname, 
        'last_name', lname,
        'email', email,
        'phone', phone
    ], (err, reply)=>{
        if(err){
            console.log(err);
            next(err);
        }

        console.log(reply);
        res.redirect('/');
    });
});

app.get("*", (req, res, next)=> {
    res.status(200).json({
        message: "You are here! That means it is dead end!"
    })
})

app.listen(port, ()=>{
    console.log('Server started on port: ' + port);
});

