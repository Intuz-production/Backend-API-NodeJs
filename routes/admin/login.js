var express = require('express');
var router = express.Router();
var passport = require('passport');
var randomBytes = require('random-bytes');
var bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');
var multer = require('multer');
var upload = multer();
var email_functions  = require('../../services/email');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants.js');
var email_temp = email_functions.func();


/* Logout */
router.get('/admin/logout', function (req, res) {
    req.logout();
    res.clearCookie("lang");
    res.redirect('/admin/login');
});

/* Redirtect to admin login page */
router.get('/admin/login', function (req, res) {
    res.render('admin/login', {
        message: req.flash('loginMessage')
    });
});

/* login form passport authentication after submit */
router.post('/admin/login', passport.authenticate('local-login', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/login',
    failureFlash: true
}));

router.post('/admin/change-langauge', function (req, res) {
    // res.render('admin/login', {
    //     message: req.flash('loginMessage')
    // });
    var lang = req.body.lang;
    res.cookie('lang',lang).send({"status":1});
    // res.render('/admin/dashboard');
});


/* Redirect to signup page */
router.get('/admin/signup', function (req, res) {
    res.render('admin/signup', {
        message: req.flash('signupMessage')
    });
});

/* signup form passport authentication after submit */
router.post('/admin/signup', passport.authenticate('local-signup', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/signup',
    failureFlash: true
}));

/* Redirect to forgot password page */
router.get('/admin/forgotpassword', function (req, res) {
    res.render('admin/forgotpassword', {
        message: req.flash('forgotPasswordMessage')
    });
});

/* forgot-password form passport authentication after submit */
router.post('/admin/forgotpassword1', passport.authenticate('local-forgot-password', {
    successRedirect: '/admin/login',
    failureRedirect: '/admin/forgotpassword',
    failureFlash: true
}));

/* forgot-password form submit */
router.post('/admin/forgotpassword', upload.array(), function (req, res) {
    var post = req.body;
    var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
    if(typeof (post.email) != "undefined" && post.email){
        var email = post.email.toLowerCase();
        req.getConnection(function (err, connection) {
            connection.query("SELECT * FROM user WHERE email='" + email + "' AND status = 1 AND role_id != '0' ", function (err, rows) {
                if (err) {
                    req.flash('forgotPasswordMessage', languages.i18n.__('Oops! Something went wrong'));
                    res.render('admin/forgotpassword', {
                        status: 0,
                        message: req.flash('forgotPasswordMessage'),
                        session: req.session
                    });
                } else {
                    if (rows.length > 0) {
                        randomBytes(48, function (err, buffer) {
                            var passwordResetToken = buffer.toString('hex');

                            var user_id = rows[0].user_id;

                            connection.query("UPDATE user SET password_reset_token = '" + passwordResetToken + "' WHERE email = '" + email + "' AND user_id = '" + user_id + "'", function (err, updateResetToken) {
                                if (err) console.log(err);
                                //email-start
                                var sql = "SELECT * FROM `email_template` WHERE emailtemplate_id = 2; ";
                                connection.query(sql, function (err, email_template) {
                                    if (err) {
                                        req.flash('forgotPasswordMessage', languages.i18n.__('Oops! Something went wrong'));
                                        res.render('admin/forgotpassword', {
                                            status: 1,
                                            message: req.flash('forgotPasswordMessage'),
                                            session: req.session
                                        });
                                    } else {

                                        if (rows[0].last_name == null || rows[0].last_name == '') {
                                            rows[0].last_name = '';
                                        }

                                        var html = email_template[0].emailtemplate_body;
                                        var html = html.replace(/{first_name}/gi, rows[0].first_name);
                                        var html = html.replace(/{last_name}/gi, rows[0].last_name);
                                        var html = html.replace(/{url}/gi, "http://" + req.headers.host + "/admin/resetpassword?token=" + passwordResetToken + " ");
                                        var data = { to: rows[0].email, subject: email_template[0].emailtemplate_subject, html: html };
                                        email_temp.send_mail(req, data, function (result) {
                                            req.flash('forgotPasswordMessage', languages.i18n.__("Mail has been sent to registered email-id"));
                                            res.render('admin/forgotpassword', {
                                                status: 1,
                                                message: req.flash('forgotPasswordMessage'),
                                                session: req.session
                                            });
                                        });
                                    }
                                });
                                //email-end
                            });
                        });
                    } else {
                        //return done(null, false, req.flash('loginMessage', 'No user found.'));
                        req.flash('forgotPasswordMessage', languages.i18n.__("Invalid User"));
                        res.render('admin/forgotpassword', {
                            status: 0,
                            message: req.flash('forgotPasswordMessage'),
                            session: req.session
                        });
                    }
                }
            });
        });
    } else {
        req.flash('forgotPasswordMessage', languages.i18n.__("Field cannot be blank"));
        res.render('forgotpassword', {
            status: 0,
            message: req.flash('forgotPasswordMessage'),
            session: req.session
        });
    }
});


/* Redirect to reset password page */
router.get('/admin/resetpassword', upload.array(), function (req, res, next) {
    var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
    if(typeof (req.query.token) != "undefined" && req.query.token){
        var resetToken = req.query.token;
        // check that token is valid or not
        req.getConnection(function (err, connection) {
            connection.query("SELECT COUNT(*) as cnt FROM user WHERE password_reset_token = '" + resetToken + "' AND status = 1", function (err, data) {
                if (data[0].cnt > 0) {
                    req.session.resetToken = resetToken;
                    req.flash('resetPasswordMessage', languages.i18n.__("Valid Token"));
                    res.render('admin/resetpassword', {
                        status: 1,
                        message: req.flash('resetPasswordMessage')
                    });
                }
                else {
                    res.send(languages.i18n.__("TOKEN MISSMATCH, INVALID REQUEST"));
                }
            });
        });
    } else {
        res.send(languages.i18n.__("TOKEN MISSMATCH, INVALID REQUEST"));
    }
});

/* Resetting password */
router.post('/admin/resetpassword', upload.array(), function (req, res, next) {
    var post = req.body;
    var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
    if(typeof (req.body.newpassword) != "undefined" && req.body.newpassword && typeof (req.body.confirmpassword) != "undefined" && req.body.confirmpassword){
        var newpassword = req.body.newpassword;
        var confirmpassword = req.body.confirmpassword;
        if (newpassword != confirmpassword) {
            req.flash('resetPasswordMessage', languages.i18n.__("password and confirm-password missmatch"));
            res.render('admin/resetpassword', {
                status: 0,
                message: req.flash('resetPasswordMessage')
            });
        } else {
            req.getConnection(function (err, connection) {
                if (err) {
                    req.flash('resetPasswordMessage', languages.i18n.__("Connection Error"));
                    res.render('admin/resetpassword', {
                        status: 0,
                        message: req.flash('resetPasswordMessage')
                    });
                } else {
                    bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            //return next(err);
                            req.flash('resetPasswordMessage', languages.i18n.__('Oops! Something went wrong'));
                            res.render('admin/resetpassword', {
                                status: 0,
                                message: req.flash('resetPasswordMessage')
                            });
                        } else {
                            bcrypt.hash(post.newpassword, salt, function (err, hash) {
                                if (err) throw err;
                                connection.query("UPDATE user SET password = '" + hash + "', password_reset_token='' WHERE password_reset_token = '" + req.session.resetToken + "'", function (err, data) {
                                    if (err) throw err;
                                    req.logout();
                                    req.flash('resetPasswordMessage', languages.i18n.__("Succesfully Reset"));
                                    res.render('admin/resetpassword', {
                                        status: 1,
                                        message: req.flash('resetPasswordMessage')
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }
    } else {
        req.flash('resetPasswordMessage', languages.i18n.__("Fields cannot be blank"));
        res.render('admin/resetpassword', {
            status: 0,
            message: req.flash('resetPasswordMessage')
        });
    }
});

/* Checking, User logged in or not */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/dashboard');
}

module.exports = router;