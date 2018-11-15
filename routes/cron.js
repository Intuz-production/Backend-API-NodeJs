var express = require('express');
var router = express.Router();
var headers = {
    'key': 'value',
};
var rest = require('restler');
var apiurl = '';
var async =require('async');
var func  = require('../config/functions');
var functions = func.func();

// railcard caching API
router.get('/cron/cronname', function (req, res, next) {


});

module.exports = router;

