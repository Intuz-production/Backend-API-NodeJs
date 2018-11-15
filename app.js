var express = require('express');
var router = express.Router();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var engine = require('ejs-locals')
var dbConfig = require('./config/db.js');
var passport = require('passport');
var http = require('http');
var access = require('./services/useraccess.js');
var lang = require('./config/configi18n');

// Passport Config
require('./config/passport')(passport);
var passport = require('passport');


/*App port declaration */
const port = process.env.PORT || 8000;

var app = express();

var mysql = require('mysql');
var connection = require('express-myconnection');

/* Express Messages Middleware */
app.use(flash());

/* view engine setup */
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* Set Public Folder */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use(logger('dev'));

/* Body Parser Middleware */
app.use(cookieParser()); // read cookies (needed for auth)

/* parse application/json */
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));

/* Express Session Middleware */
app.use(session({
    secret: 'Dr~jdprTsdf44',
    resave: true,
    saveUninitialized: true
}));

/* error handler */
app.use(function (err, req, res, next) {
    /* set locals, only providing error in development */
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'devlopment' ? err : {};

    /* render the error page */
    res.status(err.status || 500);
    res.render('error');
});

/* flash error and success mssages */
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    // res.locals.error_messages = require('express-messages')(req, res);
    res.locals.error_messages = req.flash('error_messages');
    next();
});

/* Language Setup */
app.use(function (req, res, next) {
    // mustache helper
    res.locals.__ = function (text) {
        if (req.cookies.lang != "undefined" && req.cookies.lang) {
            lang.i18n.setLocale(req.cookies.lang);
        } else {
            lang.i18n.setLocale('en');
        }
        // var x = lang.i18n.__(text);
        return lang.i18n.__(text);
    };
    next();
});

/* Express Validator Middleware */
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

/* Passport Middleware */
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

/* sql connection */
app.use(connection(mysql, dbConfig));
app.use(access.userAccess);

//API Route Files
app.use('/', require('./routes/index'));
app.use('/user', require('./routes/admin/user'));


// Admin Route Files
app.use('/', require('./routes/admin/login'));
require('./routes/admin/site')(app, passport);
require('./routes/admin/user')(app, passport);
require('./routes/admin/notification')(app, passport);
require('./routes/admin/cms')(app, passport);
require('./routes/admin/setting')(app, passport);
require('./routes/admin/settings')(app, passport);
require('./routes/admin/roles')(app, passport);
require('./routes/admin/admin_user')(app, passport);
require('./routes/admin/email_content')(app, passport);

// Cron files
app.use('/', require('./routes/cron'));

// Web API files
app.use('/', require('./routes/api/user'));
app.use('/', require('./routes/api/master'));

/* Initialize server */
var server = http.createServer(app);

/* Start Server */
server.listen(port, function () {
    console.log('HTTP server listening on port ' + port);
});

module.exports = app;
