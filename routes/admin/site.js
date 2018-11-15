var express = require('express');
var router = express.Router();
var multer = require('multer');
var http = require('http');
var async = require("async");
var gnl = require('../../services/general');
var general = gnl.func();
var bcrypt = require('bcryptjs');
var languages = require('../../config/configi18n');
var constants = require('../../config/constants');
var storage = multer.memoryStorage();

/* Initialize multer */
var upload = multer({
    storage: storage
});

module.exports = function (app, passport) {

    /* Redirect to dashboard page */
    app.get('/admin/dashboard', isLoggedIn, function (req, res) {
        var language = constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        var totat_users = 0;
        var totat_teams = 0;
        var total_checkins = 0;
        req.getConnection(function (err, connection) {
            async.parallel([
                function (callback1) {
                    var sql1 = "SELECT COUNT(*) AS user_cnt FROM user WHERE role_id = '0' AND status != '2'";
                    connection.query(sql1, function (err, rows1) {
                        if (err)
                            throw err;
                        totat_users = Number(rows1[0].user_cnt);
                        callback1();
                    });
                },
            ], function (err) {
                if (err)
                    throw err;
                res.render('admin/dashboard', {
                    users: totat_users,
                    session: req.session,
                    messages: req.flash('Message'),
                });
            });
        });
    });

    /* Getting side menus from database */
    app.post('/admin/site/side-menu', isLoggedIn, function (req, res) {
        var response = {};

        req.getConnection(function (err, connection) {
            if (err)
                throw err;

            var user_role_id = req.session.user.role_id;
            if (user_role_id == '1') { // superadmin
                var sql = " SELECT id as menu_id FROM menu_list WHERE menu_list.status = '1' ORDER BY sort asc";
            } else {
                var sql = " SELECT * FROM permission Where roles_id = '" + user_role_id + "' ";
            }

            connection.query("SELECT * FROM menu_list Where parent_menu_id = '0' AND menu_list.status = '1' ORDER BY sort asc ; " + sql, function (err, rows) {
                if (err) {
                    throw err;
                }
                else {

                    if (rows[0].length > 0) {
                        var sidemenu = '';
                        var user_permission = [];

                        if (rows[1].length > 0) {
                            rows[1].forEach(function (row) {

                                if (row.is_add == 1 || row.is_update == 1 || row.is_delete == 1 || row.is_publish == 1 || row.is_view) {
                                    user_permission.push(row.menu_id);
                                } else if (user_role_id == '1') { //superadmin
                                    user_permission.push(row.menu_id);
                                }

                            });
                        }

                        async.forEachOf(rows[0], function (val, key, callback) {
                            get_menu_data(req, val, user_permission, function (result) {
                                sidemenu += result;
                                callback();
                            });

                        }, function () {
                            response.status = 1;
                            response.data = sidemenu;
                            res.send(response);
                        })
                    }
                    else {
                        response.status = 0;
                        res.send(response);
                    }
                }
            });
        });
    });

    /* Checking access of loggin user */
    app.post('/admin/site/user-access', isLoggedIn, function (req, res) {
        response = {};

        req.getConnection(function (err, connection) {
            if (err)
                throw err;
            var user_role_id = req.session.user.role_id;
            if (user_role_id == '1') { // superadmin
                response.permission = { "is_add": 1, "is_update": 1, "is_delete": 1, "is_publish": 1 };
                response.status = 1;
                res.send(response);
            } else {
                var post = req.body;
                action_path = post.url;
                var url_segment = action_path.split('/');
                var controller_path = '/' + url_segment[1] + '/' + url_segment[2];


                var sql = "SELECT * FROM permission join menu_list on permission.menu_id = menu_list.id WHERE menu_list.status = '1' AND action_path = '" + controller_path + "' AND roles_id = '" + user_role_id + "' ORDER BY sort asc";
                connection.query(sql, function (err, rows) {
                    if (err) {
                        response.status = 0;
                        res.send(response);
                    } else {
                        if (rows.length == 1) {
                            var is_add = 0;
                            var is_update = 0;
                            var is_delete = 0;
                            var is_publish = 0;

                            if (rows[0].is_add == '1') {
                                var is_add = 1;
                            }

                            if (rows[0].is_update == '1') {
                                var is_update = 1;
                            }

                            if (rows[0].is_publish == '1') {
                                var is_publish = 1;
                            }

                            if (rows[0].is_delete == '1') {
                                var is_delete = 1;
                            }

                            response.status = 1;
                            response.permission = { "is_add": is_add, "is_update": is_update, "is_delete": is_delete, "is_publish": is_publish };

                            res.send(response);
                        } else {
                            response.status = 0;
                            res.send(response);
                        }
                    }
                });

            }
        });
    });

    /* Getting profile pic of user */
    app.post('/admin/site/get-user-data', isLoggedIn, function (req, res) {
        req.user.profile_pic_path = general.image_not_found('profile_pic', req.user.profile_pic, req.headers.host);
        res.send(req.user);
    });

    /* Redirect to change password */
    app.get('/admin/change-password', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                throw err;
            } else {
                res.render('admin/change-password', {
                    messages: req.flash('Message'),
                    session: req.session,
                });
            }
        });
    });

    /* Change password */
    app.post('/admin/change-password', isLoggedIn, function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                console.log('connection fail');
                throw err;
            } else {

                var user_id = req.session.user.user_id;

                bcrypt.genSalt(10, function (err, salt) {
                    if (err) {
                        throw err;
                    }
                    else {

                        bcrypt.hash(post.password, salt, function (err, hash) {
                            if (err) {
                                throw err;
                            }
                            else {
                                connection.query("UPDATE user SET password = '" + hash + "' WHERE user_id = '" + user_id + "'", function (err, data) {
                                    if (err) {
                                        throw err;
                                    }
                                    else {
                                        req.flash('Message', languages.i18n.__('Password Changed Successfully.'));
                                        res.redirect('/admin/change-password');
                                    }
                                });
                            }
                        });
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


/* Preparing left side menu */
function get_menu_data(req, menu_val, user_permission, done) {
    var menu_html = '';

    req.getConnection(function (err, connection) {

        var sql = "SELECT * FROM menu_list WHERE  menu_list.status = '1' AND parent_menu_id = '" + menu_val.id + "' ORDER BY sort asc";
        connection.query(sql, function (err, submenu_rows) {
            if (!err) {

                var location = req.body.url;
                var main_menu_id = menu_val.id;
                var main_menu_name = menu_val.name;
                var action_path = menu_val.action_path + menu_val.function_name;
                var icon_class = menu_val.menu_icon;

                var segments = location.split('/');
                var controller_name = segments[4];

                var db_segment = action_path.split('/');
                var db_controller = db_segment[2];

                var active_class = '';

                if (submenu_rows.length > 0) {


                    var sub_menu_html = '';
                    var is_menu_active = false;

                    submenu_rows.forEach(function (value) {
                        var sub_menu_id = value.id;
                        if (user_permission.includes(sub_menu_id)) {// check user have permission
                            var sub_menu_name = value.name;
                            var sub_action_path = value.action_path + value.function_name;
                            var sub_icon_class = value.menu_icon;

                            var db_segment = sub_action_path.split('/');
                            var db_controller = db_segment[2];

                            var active_class = '';

                            if (db_controller == controller_name) {
                                active_class = 'active';
                                is_menu_active = true;
                            }

                            sub_menu_html += '<li class="' + active_class + '" ><a href="' + sub_action_path + '" ><i class="' + sub_icon_class + '" ></i>' + sub_menu_name + '</a></li>';
                        }
                    });

                    if (sub_menu_html != "") {
                        var menu_open_class = '';
                        var display = 'display:none;';
                        if (is_menu_active) {
                            menu_open_class = 'menu-open';
                            display = 'display:block;';
                        }

                        menu_html = '<li class="treeview ' + menu_open_class + '"><a href="#">' +
                            '<i class="' + icon_class + '"></i> <span>' + languages.i18n.__(main_menu_name) + '</span>' +
                            '<span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span></a><ul class="treeview-menu" style="' + display + '">' + sub_menu_html + '</ul></li>';
                    }

                    return done(menu_html);
                } else {
                    if (user_permission.includes(main_menu_id)) {// check user have permission
                        if (db_controller == controller_name) {
                            active_class = 'active';
                        }
                        menu_html = '<li class="' + active_class + '"><a href="' + action_path + '" ><i class="' + icon_class + '" ></i><span>' + languages.i18n.__(main_menu_name) + '</span></a></li>';
                    }
                    return done(menu_html);
                }
            }
        });
    });
}