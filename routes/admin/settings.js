var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var bcrypt = require('bcryptjs');
var http = require('http');
var fs = require('fs');
var fsu = require('fs.extra');
var storage = multer.memoryStorage();

var datefn = require('../../services/datefunc');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants.js');
var datefunc = datefn.func();
var fsu = require('fs.extra');


/* Including Service files */
var fileOperations = require('../../services/fileOpearations');

/* Assigning function to a variable */
var fileUpload = fileOperations.filesop();

/* Initializing multer */
var multerUpload = multer({ storage: fileUpload.file_storage() });

var response = {};
var upload = multer();

module.exports = function (app, passport) {

    /* Redirect to settings page */
    app.get('/admin/settings/index', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query("SELECT * FROM settings Order by settingId asc", function (err, rows) {
                if (err) {
                    req.flash('errorMessage', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                } else {
                    res.render('admin/settings/index', {
                        datalist: rows,
                        controller: 'settings',
                        messages: req.flash('Message'),
                        session: req.session
                    });
                }
            });
        });
    });

    /* Redirect to create page */
    app.get('/admin/settings/create', isLoggedIn, function (req, res) {

        req.getConnection(function (err, connection) {
            if (err) {
                throw err;
            } else {
                res.render('admin/settings/create', {
                    model: [],
                    messages: req.flash('Message'),
                    isNewRecord: 1,
                    session: req.session
                });
            }
        });
    });

    /* Redirect to update page */
    app.get('/admin/settings/update', isLoggedIn, function (req, res) {

        req.getConnection(function (err, connection) {
            if (err) {
                throw err
            } else {
                connection.query("SELECT * FROM settings WHERE settingId = ?", [req.query.settingId], function (err, rows) {
                    res.render('admin/settings/create', {
                        model: rows[0],
                        messages: req.flash('Message'),
                        isNewRecord: 0,
                        session: req.session,
                        fs: fs
                    });
                });
            }
        });
    });

    /* Update settings */ 
    app.post('/admin/settings/save', multerUpload.fields([{ 'name': 'setting_logo_image' }, { 'name': 'setting_favicon_image' }]), isLoggedIn, function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        var user_id = req.session.user.user_id;
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/settings/index');
            } else {

                var t_date = new Date();

                if (post.settingId == 0) {
                    var sql = "INSERT INTO `settings` SET ?";
                    var values_data = {};
                    values_data.settingKey = post.settingKey;
                    values_data.settingValue = post.settingValue;
                    var message = languages.i18n.__('Data Added Successfully');
                } else {
                    if (typeof (post.settingKey) != "undefined" && post.settingKey == 'setting_logo_image') { // upload logo
                        if (typeof (req.files.setting_logo_image) != "undefined") {

                            var filename = req.files.setting_logo_image[0].filename;
                            var newPath = 'uploads/setting_logo_image/' + filename;

                            fs.unlink('uploads/setting_logo_image/logo.png', function (err) {
                                fs.rename(newPath, 'uploads/setting_logo_image/logo.png', function (err) {
                                    if (err) throw err;
                                });
                            });
                        }
                        post.settingValue = 'logo.png'; // set logo name

                    } else if (typeof (post.settingKey) != "undefined" && post.settingKey == 'setting_favicon_image') { // upload favicon
                        if (typeof (req.files.setting_favicon_image) != "undefined") {

                            var filename_favicon = req.files.setting_favicon_image[0].filename;
                            var newPathFavicon = 'uploads/setting_favicon_image/' + filename_favicon;

                            fs.unlink('uploads/setting_favicon_image/logo.png', function (err) {
                                fs.rename(newPathFavicon, 'uploads/setting_favicon_image/logo-mini.png', function (err) {
                                    if (err) throw err;
                                });
                            });
                        }
                        post.settingValue = 'logo-mini.png'; // set fav name
                    }

                    // update into db
                    var sql = "UPDATE settings SET settingValue = ?, updatedBy = ?, updatedOn = ? WHERE settingId = ? ";
                    var values_data = [post.settingValue, user_id, t_date, post.settingId];
                    var message = languages.i18n.__('Data Updated Successfully');
                }

                connection.query(sql, values_data, function (err, attribute) {
                    if (err) {

                        req.flash('Message', err);
                        res.render('admin/settings/create', {
                            model: [],
                            messages: req.flash('Message'),
                            isNewRecord: 1,
                            session: req.session,
                            fs: fs
                        });
                    } else {
                        req.flash('Message', message);
                        res.redirect('/admin/settings/index');
                    }
                });
            }
        });
    });

}


/* Checking, User logged in or not */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
