var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var bcrypt = require('bcryptjs');
var http = require('http');
var constants = require('../../config/constants');
var languages = require('../../config/configi18n');

/* Storage configuration */
var storage = multer.memoryStorage();

/* Initializing multer */
var upload = multer();

module.exports = function (app, passport) {

    /* Redirecting to roles listing page */
    app.get('/admin/roles/index', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) throw err; // roles id = 1 for superadmin
            connection.query("SELECT * FROM roles WHERE status != '2' and id != '1' Order by id desc", function (err, rows) {
                if (err) {
                    req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                } else {
                    res.render('admin/roles/index', {
                        datalist: rows,
                        controller: 'roles',
                        messages: req.flash('Message'),
                        session: req.session
                    });
                }
            });
        });
    });

    /* Active/Inactive Role */
    app.post('/admin/roles/activedeactive' , function(req, res, next){
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function(err , connection){
            if(err){
                throw err;
            } else {
                if (req.users_access == 'yes') {
                    connection.query("UPDATE roles SET status = '" + req.body.status + "' WHERE id = " + req.body.id + " ", function (err, data) {
                        if (err) {
                            throw err;
                        }
                        else {
                            res.redirect('/admin/roles/index');
                        }
                    });
                } else {
                    res.redirect('/admin/roles/index');
                }
            }
        });
    });

    /* Delete role */
    app.post('/admin/roles/delete', function (req, res, next) {
        req.getConnection(function (err, connection) {
            if (err) {
                throw err;
            } else {
                if (req.users_access == 'yes') {
                    var sql_delete_permission = "Delete FROM permission WHERE roles_id = " + req.body.id;
                    connection.query("UPDATE roles SET status = '2' WHERE id = '" + req.body.id + "' ; " + sql_delete_permission, function (err, data) {
                        if (err) {
                            throw err;
                        }
                        else {
                            res.redirect('/admin/roles/index');
                        }
                    });
                } else {
                    res.redirect('/admin/roles/index');
                }
            }
        });
    });

    /* Redirect to create role */
    app.get('/admin/roles/create', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                throw err
            } else {
                connection.query("SELECT * FROM `menu_list` WHERE `action_path` != '' AND menu_list.status = '1' order by name asc ", function (err, rows) {
                    res.render('admin/roles/create', {
                        messages: req.flash('Message'),
                        isNewRecord: 1,
                        menulist: rows,
                        model: [],
                    });
                });
            }
        });
    });

    /* Redirect to update role */
    app.get('/admin/roles/update', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                throw err
            } else {

                var select_sql = " select roles_id, m.*, is_add, is_update, is_delete, is_view, is_publish from permission p right join menu_list m on ( p.menu_id = m.id and p.roles_id = '" + req.query.id + "') where m.action_path != '' order by name asc ";
                connection.query("SELECT * FROM roles WHERE id = '" + req.query.id + "' AND status != '2' and id != '1'; " + select_sql, function (err, rows) {
                    if (rows.length > 0) {
                        res.render('admin/roles/create', {
                            model: rows[0][0],
                            messages: req.flash('Message'),
                            isNewRecord: 0,
                            session: req.session,
                            menulist: rows[1],
                        });
                    } else {
                        res.redirect('/admin/roles/index');
                    }
                });
            }
        });
    });

    /* Create/Update role */
    app.post('/admin/roles/save', isLoggedIn, upload.array(), function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function(err, connection) {
            if (err) {
                req.flash('Message', err);
                res.render('admin/attribute/create', {
                    messages: req.flash('Message')
                });
            } else {

                var t_date = new Date();

                if (post.id == 0) {
                    var sql = "INSERT INTO roles (name,created_by, created_date) VALUES ?";
                    var values = [
                        [
                            [post.name, '1', t_date]
                        ]
                    ];
                    var message = languages.i18n.__('Data Added Successfully');
                } else {
                    var sql = "UPDATE roles SET name = ?, modified_by = ?, modified_date = ? WHERE id = ? ";
                    var values = [post.name, '1', t_date, post.id];
                    var message = languages.i18n.__('Data Updated Successfully');
                }

                connection.query(sql, values, function (err, rows) {
                    if (err) {
                        req.flash('Message', languages.i18n.__('Oops! Something went wrong'));
                        res.render('admin/roles/create', {
                            error_messages: req.flash('Message'),
                            isNewRecord: (post.id != 0) ? 0 : 1,
                            model: post,
                            session: req.session
                        });
                    } else {

                        if (post.id != 0) {
                            connection.query("Delete FROM permission where roles_id = " + post.id, function (err, data) {
                                if (err) {
                                    throw err;
                                }
                            });

                            roles_id = post.id;
                        } else {
                            roles_id = rows.insertId;
                        }

                        menu_array = post.roles.menu_id;

                        var data = [];

                        if (menu_array.length > 0) {
                            menu_array.forEach(function (value, key) {
                                var menu_id = value;

                                var is_add = 0;
                                if (post.roles.add) {
                                    var is_add = (typeof (post.roles.add[key]) == "undefined") ? 0 : 1;
                                }

                                var is_update = 0;
                                if (post.roles.update) {
                                    var is_update = (typeof (post.roles.update[key]) == "undefined") ? 0 : 1;
                                }

                                var is_delete = 0;
                                if (post.roles.delete) {
                                    var is_delete = (typeof (post.roles.delete[key]) == "undefined") ? 0 : 1;
                                }

                                var is_view = 0;
                                if (post.roles.view) {
                                    var is_view = (typeof (post.roles.view[key]) == "undefined") ? 0 : 1;
                                }

                                var is_publish = 0;
                                if (post.roles.publish) {
                                    var is_publish = (typeof (post.roles.publish[key]) == "undefined") ? 0 : 1;
                                }


                                // Any access for selected menu
                                if (is_add == 1 || is_update == 1 || is_delete == 1 || is_view == 1 || is_publish == 1) {
                                    var insert_data = [roles_id, menu_id, is_add, is_update, is_delete, is_publish, is_view, '1', t_date];
                                    data.push(insert_data);
                                }

                            });
                        }

                        var premission_sql = "INSERT INTO permission (roles_id, menu_id, is_add, is_update, is_delete, is_publish, is_view, created_by, created_date) VALUES ?";

                        connection.query(premission_sql, [data], function (err, rows) {
                            if (err) {
                                console.log(err);
                                req.flash('Message', languages.i18n.__('Oops! Something went wrong'));
                                res.render('admin/roles/create', {
                                    messages: req.flash('Message'),
                                    isNewRecord: (post.id != 0) ? 0 : 1,
                                    model: post,
                                    session: req.session
                                });
                            } else {
                                req.flash('Message', message);
                                res.redirect('/admin/roles/index');
                            }
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
