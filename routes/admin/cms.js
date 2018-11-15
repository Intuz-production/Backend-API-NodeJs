var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var bcrypt = require('bcryptjs');
var http = require('http');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants.js');


var storage = multer.memoryStorage();

var upload = multer();

module.exports = function (app, passport) {

    /* Redirect to cms management page */
    app.get('/admin/cms/index', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query("SELECT * FROM cms_management WHERE status != '2' Order by id desc", function (err, rows) {
                if (err) {
                    req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                } else {
                    res.render('admin/cms/index', {
                        datalist: rows,
                        controller: 'cms',
                        messages: req.flash('Message'),
                        session: req.session
                    });
                }
            });
        });
    });

    /* Redirect to create cms page */
    app.get('/admin/cms/create', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/cms/index');
            } else {
                res.render('admin/cms/create', {
                    model: [],
                    messages: req.flash('Message'),
                    isNewRecord: 1,
                    session: req.session
                });
            }
        });
    });

    /* Redirect to update cms page */
    app.get('/admin/cms/update', isLoggedIn, function (req, res) {

        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/cms/index');
            } else {
                connection.query("SELECT * FROM cms_management WHERE id = ? AND status != ?", [req.query.id, 2], function (err, rows) {
                    res.render('admin/cms/create', {
                        model: rows[0],
                        messages: req.flash('Message'),
                        isNewRecord: 0,
                        session: req.session
                    });
                });
            }
        });
    });

    /* Create or update cms data */
    app.post('/admin/cms/save', isLoggedIn, upload.array(), function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/cms/index');
            } else {

                var t_date = new Date();

                if (post.id == 0) {
                    var sql = "INSERT INTO `cms_management` SET ?";
                    var values_data = {};
                    values_data.title = post.title;
                    values_data.content = post.content;
                    values_data.type = ((post.title).split(' ').join('_')).toLowerCase();
                    var message = languages.i18n.__('Data Added Successfully');
                } else {

                    var sql = "UPDATE cms_management SET title = ?,content = ? WHERE id = ? ";
                    var values_data = [post.title, post.content, post.id];
                    var message = languages.i18n.__('Data Updated Successfully');
                }

                connection.query(sql, values_data, function (err, attribute) {
                    if (err) {
                        // req.flash('Message', err);
                        // res.render('admin/cms/create', {
                        //     model: [],
                        //     messages: req.flash('Message'),
                        //     isNewRecord: 1,
                        //     session: req.session
                        // });

                        req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                        res.redirect('/admin/cms/index');
                    } else {
                        req.flash('Message', message);
                        res.redirect('/admin/cms/index');
                    }
                });
            }
        });
    });
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
