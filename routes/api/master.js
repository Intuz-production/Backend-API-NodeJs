var express = require('express');
var http = require('http');
var request = require('request');
var router = express.Router();
var multer = require('multer');

var msg  = require('../../config/messages');
var func  = require('../../config/functions');
var functions = func.func();
var messages = msg.messages;
var constants = require('../../config/constants');
var locale = require('../../config/configi18n');
var async =require('async');

var headers = {
    'key': 'value',
};

var rest = require('restler');

var response = {};
var upload = multer();

//Get categories masters
router.post('/api/master/get-master-data', upload.array(), function(req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var data = [];
    if (typeof(post.type) != 'undefined' && post.type) {
        var where = "status = '1' ";
        if (typeof(post.id) != 'undefined' && post.id > 0) {
            var id_name = "id";
            where = where + "AND " + id_name + "='" + post.id + "' ";
        }
        var days = [];
        req.getConnection(function(err, connection) {
            if (err)
                throw err;
                    
            connection.query("SELECT * FROM " + post.type + " WHERE " + where + " ORDER BY name ASC", function(err, rows) {
                if (err) {
                    console.log("Error :", err);
                    response.status = 0;
                    response.message =locale.i18n.__(messages.OOPS);
                    res.send(response);
                } else {
                    var data = [];
                    if (rows.length > 0) {
                        rows.forEach(function(row) {
                            var row_data = {
                                id: parseInt(row.id),
                                name: (row.name).toString(),
                            };
                            data.push(row_data);
                        });
                    }
                   
                    response.status = 1;
                    response.message = locale.i18n.__(messages.SUCCESS);
                    response.data = data;
                    res.send(response);
                }
            });
      
           
        });
    } else {
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM);
        res.send(response);
    }
});

/*
*GET CMS
*type= terms,type = privacy
*/
router.post('/api/master/get-cms', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['type'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {

            connection.query("SELECT * FROM cms_management WHERE status=1 and type='" + post.type + "'", function (err, rows) {
                if (err) {
                    console.log(err);
                    response.status = 0;
                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                    res.send(response);
                }
                else {
                    var result = {};
                    if (rows.length > 0) {

                        result.id = rows[0]['id'];
                        result.title = rows[0]['title'];
                        result.content = (rows[0]['content'] != '' && rows[0]['content'] != null) ? '<html>' + rows[0]['content'] + '</html>' : '';

                        response.status = 1;
                        response.message = locale.i18n.__(messages.SUCCESS);
                        response.data = result;
                        res.send(response);
                    }
                    else {
                        response.status = 1;
                        response.message = locale.i18n.__(messages.NO_DATA_FOUND);
                        response.data = result;
                        res.send(response);
                    }
                }
            });

        });


    }
    else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

module.exports = router;

// route middleware to ensure user is valid
function isUserActive(req, res, next) {
    var post = req.body;
    var userid = 0;
    var response = {};
    if(typeof(post.user_id)!="undefined" && post.user_id > 0){
        userid = post.user_id;
    }
    if(userid > 0){
        req.getConnection(function(err, connection) {
            if (err) {
                console.log(err);
                throw err;
            } else {
                var sql = "SELECT status FROM user WHERE user_id = '"+userid+"'";
                connection.query(sql, function(err, rows){
                    if(err) {
                        console.log(err);
                        throw err;
                    } else {
                        if(rows.length > 0){
                            if(rows[0].status == 0){
                                response.status = -1;
                                response.message = "Sorry! Your account is in-active temporarily";
                                res.send(response);
                            }else if(rows[0].status == 2){
                                response.status = -1;
                                response.message = "Sorry! Your account is deactive permanently";
                                res.send(response);
                            }else{
                                return next();
                            }
                        } else {
                            response.status = -1;
                            response.message = "Sorry! Invalid user";
                            res.send(response);
                        }
                    }
                });
            }
        });
    }else{
        return next();
    }
}