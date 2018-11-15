var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var bcrypt = require('bcryptjs');
var http = require('http');
var fs = require('fs');
var datefn = require('../../services/datefunc');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants.js');
var datefunc = datefn.func();
var fsu = require('fs.extra');


var fileOperations = require('../../services/fileOpearations');
var fileUpload = fileOperations.filesop();
var multerUpload = multer({ storage: fileUpload.file_storage() });

var response = {};
var upload = multer();

module.exports = function (app, passport) {

    /* Redirect to update setting page */
    app.get('/admin/setting/update', isLoggedIn, function (req, res) {

        req.getConnection(function (err, connection) {
            if (err) {
                throw err
            } else {
                connection.query("SELECT * FROM setting WHERE setting_id = ? ", [1], function (err, rows) {

                    res.render('admin/setting/create', {
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
    app.post('/admin/setting/update', isLoggedIn, multerUpload.fields([{ 'name': 'setting_logo_image' }, { 'name': 'setting_favicon_image' }]), function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/setting/update');
            } else {
                var set_condition = "";
                var whr_arr = [];

                if (typeof (post.setting_email) != "undefined" && post.setting_email) {
                    set_condition += "setting_email=?";
                    whr_arr.push(post.setting_email);
                }
                var sql = "UPDATE setting SET " + set_condition + " WHERE setting_id = 1";
                var values_data = whr_arr;
                var message = languages.i18n.__('Settings Updated Successfully');


                if (typeof (req.files.setting_logo_image) != "undefined") {
                    var filename = req.files.setting_logo_image[0].filename;
                    var newPath = 'uploads/setting_logo_image/' + filename;

                    fs.unlink('uploads/setting_logo_image/logo.png', function (err) {
                        fs.rename(newPath, 'uploads/setting_logo_image/logo.png', function (err) {
                            if (err) throw err;
                        });
                    });

                }
                if (typeof (req.files.setting_favicon_image) != "undefined") {
                    var filename_favicon = req.files.setting_favicon_image[0].filename;
                    var newPathFavicon = 'uploads/setting_favicon_image/' + filename_favicon;

                    fs.unlink('uploads/setting_favicon_image/logo-mini.png', function (err) {
                        fs.rename(newPathFavicon, 'uploads/setting_favicon_image/logo-mini.png', function (err) {
                            if (err) throw err;
                        });
                    });

                }


                connection.query(sql, values_data, function (err, attribute) {
                    if (err) {
                        req.flash('errorMessage', languages.i18n.__('Oops! Something went wrong'));
                        res.redirect('/admin/setting/update');
                    } else {
                        req.flash('Message', message);
                        res.redirect('/admin/setting/update');
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
    res.redirect('/admin');
}
