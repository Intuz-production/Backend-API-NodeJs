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

    /* Redirect to email template listing page */
    app.get('/admin/email-content/index', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query("SELECT * FROM email_template WHERE status = 1", function (err, rows) {
                if (err) {
                    req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                } else {
                    res.render('admin/email_content/index', {
                        datalist: rows,
                        controller: 'email-content',
                        messages: req.flash('Message'),
                        session: req.session
                    });
                }
            });
        });
    });

    /* Redirect to update email template content */
    app.get('/admin/email-content/update', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/email-content/index');
            } else {
                connection.query(`SELECT * FROM email_template WHERE emailtemplate_id = ${req.query.id} AND status = 1`, function (err, rows) {
                    res.render('admin/email_content/update', {
                        model: rows[0],
                        messages: req.flash('Message'),
                        isNewRecord: 0,
                        session: req.session
                    });
                });
            }
        });
    });

    /* Update email template content */
    app.post('/admin/email-content/save', isLoggedIn, upload.array(), function (req, res) {
        var input = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/email-content/index');
            } else {
                var sql = `UPDATE email_template SET emailtemplate_subject = '${input.subject}', emailtemplate_body = '${input.content}' WHERE emailtemplate_id = ${input.id}`;
                var message = 'Data Updated Successfully';
                connection.query(sql, function (err, attribute) {
                    if (err) {
                        // req.flash('error_message', err);
                        // res.render('admin/email-content/update', {
                        //     model: [],
                        //     messages: req.flash('Message'),
                        //     isNewRecord: 1,
                        //     session: req.session,
                        //     messages: req.flash('error_message'),
                        // });
                        req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                        res.redirect('/admin/email-content/index');
                    } else {
                        req.flash('Message', message);
                        res.redirect('/admin/email-content/index');
                    }
                });
            }
        });
    });
}

/* route middleware to ensure user is logged in */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
