// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var randomBytes = require('random-bytes');
var nodemailer = require('nodemailer');
var dbconfig = require('./db.js');
var constants = require('./constants');
var mysql = require('mysql');

var languages = require('./configi18n');

//Database connection
var connection = mysql.createConnection({
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password
});

connection.query('USE ' + dbconfig.database);

// load up the user model
module.exports = function (passport) {
    // passport session setup ==================================================

    // serialize the user
    passport.serializeUser(function (user, done) {
        done(null, user.user_id);
    });

    // deserialize the user
    passport.deserializeUser(function (user_id, done) { // role_id = 0 for user
        connection.query("SELECT * FROM user WHERE user_id = '" + user_id + "' AND status = 1 AND role_id != '0'", function (err, rows) {
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function (req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                req.getConnection(function (err, connection) { // role_id = 0 for user
                    connection.query("SELECT * FROM user WHERE email='" + email + "' AND status = 1 AND role_id != '0'", function (err, rows) {
                        if (err) {
                            return done(err);
                        } else {
                            if (rows.length > 0) {

                                var password_hash = rows[0].password;
                                var user_id = rows[0].user_id;

                                // Load hash from your password DB.
                                bcrypt.compare(password, password_hash, function (err, result) {
                                    if (err) {
                                        return done(err);
                                    } else if (result === true) {
                                        req.session.user = rows[0];
                                        req.cookies.lang = 'en';
                                        return done(null, rows[0]);
                                    } else {
                                        return done(null, false, req.flash('loginMessage', languages.i18n.__('Oops! Something went wrong')));
                                    }
                                    // res === true
                                });
                            } else {
                                return done(null, false, req.flash('loginMessage', languages.i18n.__('Invalid User')));
                            }
                        }
                    });
                });
            });
        }));

    // =========================================================================
    // LOCAL FORGOT PASSWORD =============================================================
    // =========================================================================
    passport.use('local-forgot-password', new LocalStrategy({
        usernameField: 'email',
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function (req, email, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                req.getConnection(function (err, connection) { // role_id = 0 for user
                    connection.query("SELECT * FROM user WHERE email='" + email + "' AND status = 1 AND role_id != '0'", function (err, rows) {
                        if (err) {
                            return done(null, false, req.flash('forgotPasswordMessage', languages.i18n.__(err)));
                        } else {
                            if (rows.length > 0) {
                                var transporter = nodemailer.createTransport({
                                    debug: true,
                                    host: constants.SMTP.SMTP_HOST,
                                    secureConnection: false, // true for 465, false for other ports
                                    port: constants.SMTP.SMTP_PORT,
                                    tls: { cipher: 'SSLv3' },
                                    auth: {
                                        user: constants.SMTP.SMTP_EMAIL,
                                        pass: constants.SMTP.SMTP_PASSWORD,
                                    }
                                });

                                randomBytes(48, function (err, buffer) {
                                    var passwordResetToken = buffer.toString('hex');

                                    connection.query("UPDATE user SET password_reset_token = '" + passwordResetToken + "' WHERE email = '" + email + "' ", function (err, updateResetToken) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            var mailOptions = {
                                                from: 'testprojdev@gmail.com',
                                                to: email,
                                                subject: 'Reset Password',
                                                html: '<p>Hello ' + rows[0].first_name + '</p><p>Click on this link to reset your password : <a href="' + req.headers.host + '/admin/resetpassword?token=' + passwordResetToken + '">Reset Password</a></p><br /> Regards,<br />Team ' + constants.APP_NAME + ' ',
                                            };
                                            transporter.sendMail(mailOptions, function (error, info) {
                                                if (error) {
                                                    return done(null, false, req.flash('forgotPasswordMessage', languages.i18n.__('Oops! Something went wrong while sending a mail')));
                                                } else {
                                                    return done(null, true, req.flash('forgotPasswordMessage', languages.i18n.__('Mail has been sent to registered email-id')));
                                                }
                                            });
                                        }
                                    });
                                });
                            } else {
                                return done(null, false, req.flash('loginMessage', languages.i18n.__('No user found.')));
                            }
                        }
                    });
                });
            });
        }));

};