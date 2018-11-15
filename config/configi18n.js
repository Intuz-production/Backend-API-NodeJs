var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var i18n = require('i18n');
var path = require('path');
var app = express();

i18n.configure({
    locales: ['es','en'],   //define how many languages we would support in our application
    directory: path.join(__dirname,'../languages'),  //define the path to language json files, default is /locales
    defaultLocale: 'en',                //define the default language
    cookie: 'lang'                      // define a custom cookie name to parse locale settings from 
});

// Body Parser Middleware
app.use(cookieParser()); // read cookies (needed for auth)
// Express Session Middleware
app.use(session({
    secret: 'mSNZjn,8e6#~*DD',
    resave: true,
    saveUninitialized: true
}));
//init i18n after cookie-parser
app.use(i18n.init);

module.exports.i18n = i18n;