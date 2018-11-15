var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var http = require('http');
var async = require('async');
var fs = require('fs');
var moment = require('moment');

/* Required Files */
var pushfunc = require('../../config/pushnotification');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants.js');

var push_function = pushfunc.notification();

/* Storage configuration */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/ad_photo/')
    },
    filename: function (req, file, cb) {
        var getFileExt = function (fileName) {
            var fileExt = fileName.split(".");
            if (fileExt.length === 1 || (fileExt[0] === "" && fileExt.length === 2)) {
                return "";
            }
            return fileExt.pop();
        }
        var microsecond = Math.round(new Date().getTime() / 1000 * Math.floor(Math.random() * 1000000000)); //new Date().getTime();
        cb(null, microsecond + path.extname(file.originalname)); // Date.now() + '.' + getFileExt(file.originalname))
    }
});

/* Initializing multer */
var multerUpload = multer({ storage: storage });

var upload = new multer();

module.exports = function (app, passport) {

    /* Redirecting to broadcast notifications list page */
    app.get('/admin/notification/index', isLoggedIn, function (req, res) {
        res.render('admin/notification/index', {
            datalist: [],
            messages: req.flash('Message'),
            controller: 'notification',
            session: req.session,
            fs: fs,// for images
        });
    });

    /* Getting broadcast notifications */
    app.post('/admin/notification/index', isLoggedIn, function (req, res) {

        let input = req.body;
        let limit = parseInt(input.length);
        let skip = parseInt(input.start);
        let asc_desc = input.order[0].dir;
        let sort_column = parseInt(input.order[0].column);
        let order_by = "id";
        let serial_number = skip;


        if (sort_column == 1) {
            order_by = "title";
        }
        else if (sort_column == 2) {
            order_by = "message";
        }
        else if (sort_column == 3) {
            order_by = "created_at";
        }

        if (input.search.value == "") {
            req.getConnection(function (err, connection) {
                if (err) {
                    req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                }
                else {
                    let query = `SELECT * from notifications WHERE type = 'broadcast' AND status != '2' order by ${order_by};SELECT * from notifications WHERE type = 'broadcast' AND status != '2' order by ${order_by} ${asc_desc} limit ${limit} OFFSET ${skip}`;

                    connection.query(query, function (err, rows) {
                        if (err) {
                            req.flash('error_messages', languages.i18n.__("Oops! Something went wrong"));
                            res.redirect('/admin/dashboard');
                        } else {
                            let formatted_result = [];

                            rows[1].forEach(function (element) {
                                formatted_result.push([
                                    serial_number += 1,
                                    element.title,
                                    element.message,
                                    moment(element.created_at).format('YYYY-MM-DD HH:mm'),
                                    `<a class="useraccess_delete" onclick="Delete('${element.id}', 'notification')" title="Delete" style="cursor:pointer;"><i class="fa fa-trash-o"></i></a>`
                                ])
                            });

                            res.json({
                                "draw": input.draw,
                                "recordsTotal": rows[0].length,
                                "recordsFiltered": rows[0].length,
                                "data": formatted_result
                            });
                        }
                    });
                }
            });
        }
        else {
            req.getConnection(function (err, connection) {
                if (err) {
                    req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                }
                else {
                    connection.query(`SELECT * from notifications WHERE type = 'broadcast' AND status != '2' order by ${order_by};SELECT * from notifications WHERE type = 'broadcast' AND status != '2' AND (title like '%${input.search.value}%' OR message like '%${input.search.value}%' OR DATE_FORMAT(created_at,'%Y-%m-%d') like '%${input.search.value}%') order by ${order_by} ${asc_desc} limit ${limit} OFFSET ${skip}`, function (err, rows) {
                        if (err) {
                            req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                            res.redirect('/admin/dashboard');
                        } else {

                            let formatted_result = [];

                            rows[1].forEach(function (element) {
                                formatted_result.push([
                                    serial_number += 1,
                                    element.title,
                                    element.message,
                                    moment(element.created_at).format('YYYY-MM-DD HH:mm'),
                                    `<a class="useraccess_delete" onclick="Delete('${element.id}', 'notification')" title="Delete" style="cursor:pointer;"><i class="fa fa-trash-o"></i></a>`
                                ]);
                            });

                            res.json({
                                "draw": input.draw,
                                "recordsTotal": rows[0].length,
                                "recordsFiltered": rows[1].length,
                                "data": formatted_result
                            });
                        }
                    });
                }
            });
        }
    });

    /* Redirecting to send notification page */
    app.get('/admin/notification/send', isLoggedIn, function (req, res) {
        res.render('admin/notification/create', {
            session: req.session,
            status: 1,
            isNewRecord: 1,
            message: req.flash('notificationMessage')
        });
    });


    /* Sending notifications to the users */
    app.post('/admin/notification/send', isLoggedIn, multerUpload.single('ad_photo'), function (req, res, next) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        // get token of all users
        req.getConnection(function (err, connection) {
            connection.query("SELECT * from user WHERE push_notification = 1 AND status != 2 AND role_id = 0", function (err, user_result) {
                if (err) {
                    req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/notification/index');
                } else {
                    if (user_result.length > 0) {
                        let android_device_token_array = [];
                        let ios_device_token_array = [];
                        let message = post.message;

                        user_result.forEach(function (element) {
                            if (element.device_token != "" && element.device_token != null && element.device_token != undefined) {
                                if (element.device_type == "android") {
                                    android_device_token_array.push(element.device_token);
                                }
                                else {
                                    ios_device_token_array.push(element.device_token);
                                }
                            }
                        }, this);
                        let android_message = {
                            registration_ids: android_device_token_array, // required fill with device token or topics
                            data: {
                                'created_date': moment().format('X'),
                                'title': post.title,
                                'body': message,
                                'payload': {
                                    'type': "broadcast_message"
                                }
                            }
                        };
                        let ios_message = {
                            registration_ids: ios_device_token_array, // required fill with device token or topics
                            data: {
                                'created_date': moment().format('X'),
                                'payload': {
                                    'type': "broadcast_message"
                                }
                            },
                            notification: {
                                title: post.title,
                                body: message
                            }
                        };
                        push_function.sendNotifications(android_device_token_array, ios_device_token_array, android_message, ios_message, req);

                        connection.query(`insert into notifications (title,message,type,user_id) VALUES ('${post.title}', '${post.message}', 'broadcast', ${req.session.user.user_id})`, function (err, notification_result) {
                            if (err) {
                                req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                                res.redirect('/admin/notification/index');
                            } else {

                                req.flash('Message', languages.i18n.__('Notification has been sent to all subscribers'));
                                res.redirect('/admin/notification/index');
                            }
                        });
                    }
                    else {
                        req.flash('error_messages', languages.i18n.__('No user found'));
                        res.redirect('/admin/notification/index');
                    }
                }
            });
        });
    });

    /* Delete notification */
    app.post('/admin/notification/delete', isLoggedIn, function (req, res) {

        let input = req.body;

        req.getConnection(function (err, connection) {
            if (err) {
                res.json({
                    status: 0,
                    message: languages.i18n.__("Oops! Something went wrong")
                });
            }
            else {
                let query = `update notifications set status = 2 where id = ${input.id}`;

                connection.query(query, function (err, rows) {
                    if (err) {
                        res.json({
                            status: 0,
                            message: languages.i18n.__("Oops! Something went wrong")
                        });
                    } else {
                        res.json({
                            status: 1,
                            message: languages.i18n.__("Notification deleted successfully.")
                        });
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