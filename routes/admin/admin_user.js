var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var bcrypt = require('bcryptjs');
var http = require('http');
var constants = require('../../config/constants.js');
var func = require('../../services/functions');
var functions = func.func();
var fs = require('fs');

var fileOperations = require('../../services/fileOpearations');
var languages = require('../../config/configi18n');
var fileUpload = fileOperations.filesop();
var multerUpload = multer({ storage: fileUpload.file_storage() });

module.exports = function (app, passport) {

    /* Redirect to sub-admin user listing page */
    app.get('/admin/admin-user/index', isLoggedIn, function (req, res) {
        res.render('admin/admin_user/index', {
            Users: [],
            messages: req.flash('Message'),
            controller: 'admin-user',
            session: req.session,
            fs: fs,// for images
        });
    });


    /* Get Sub admin Users */
    app.post('/admin/admin-user/index', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        let input = req.body;
        let limit = parseInt(input.length);
        let skip = parseInt(input.start);
        let asc_desc = input.order[0].dir;
        let sort_column = parseInt(input.order[0].column);
        let order_by = "u.user_id";
        let serial_number = skip;

        if (sort_column == 1) {
            order_by = "u.first_name";
        }
        else if (sort_column == 2) {
            order_by = "u.email";
        }
        else if (sort_column == 3) {
            order_by = "u.phone";
        }
        else if (sort_column == 4) {
            order_by = "r.name";
        }

        if (input.search.value == "") {
            req.getConnection(function (err, connection) {
                if (err) {
                    req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/dashboard');
                }
                else {
                    let query = `SELECT u.*, r.name as user_role FROM user u join roles r on u.role_id = r.id WHERE u.role_id != '0' AND u.role_id != '1' AND u.status != 2;SELECT u.*, r.name as user_role FROM user u join roles r on u.role_id = r.id WHERE u.role_id != '0' AND u.role_id != '1' AND u.status != '2' order by ${order_by} ${asc_desc} limit ${limit} OFFSET ${skip}`;

                    connection.query(query, function (err, rows) {
                        if (err) {
                            req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                            res.redirect('/admin/dashboard');
                        } else {

                            let formatted_result = [];

                            rows[1].forEach(function (element) {
                                formatted_result.push([
                                    serial_number += 1,
                                    `${element.first_name} ${element.last_name}`,
                                    element.email,
                                    element.phone,
                                    element.user_role,
                                    `<img src="${element.profile_pic != null && element.profile_pic != "" ? `${constants.API_URL}/profile_pic/${element.profile_pic}` : `${constants.API_URL}/${constants.NO_IMAGE_PATH}`}" width="80" />`,
                                    `<a class="btn btn-primary" href="/admin/admin-user/change-password?id=${element.user_id}">Change Password</a>`,
                                    `<a class="useraccess_active-dective ${element.status != 0 ? 'text-success' : 'text-danger'}" title="Status" onclick="Activedeactive(${element.user_id},${element.status == 0 ? 1 : 0}, 'admin-user')" style="cursor:pointer;"><i class="fa ${element.status != 0 ? 'fa-eye' : 'fa-eye-slash'}"></i></a> 
                                            <a class="useraccess_update" href="/admin/admin-user/update?id=${element.user_id}" style="cursor:pointer;"><i class="fa fa-pencil"></i></a>
                                            <a class="useraccess_delete" onclick="Delete(${element.user_id}, 'admin-user')" title="Delete" style="cursor:pointer;"><i class="fa fa-trash-o"></i></a>`
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
                    let select_query = `SELECT u.*, r.name as user_role FROM user u join roles r on u.role_id = r.id WHERE u.role_id != 0 AND u.role_id != 1 AND u.status != 2;SELECT u.*, r.name as user_role FROM user u join roles r on u.role_id = r.id WHERE u.role_id != 0 AND u.role_id != 1 AND u.status != 2 AND (u.first_name like '%${input.search.value}%' OR u.email like '%${input.search.value}%' OR u.phone like '%${input.search.value}%' OR r.name like '%${input.search.value}%') order by ${order_by} ${asc_desc} limit ${limit} OFFSET ${skip}`;
                    connection.query(select_query, function (err, rows) {
                        if (err) {
                            req.flash('error_messages', languages.i18n.__('Oops! Something went wrong'));
                            res.redirect('/admin/dashboard');
                        } else {

                            let formatted_result = [];

                            rows[1].forEach(function (element) {
                                formatted_result.push([
                                    serial_number += 1,
                                    `${element.first_name} ${element.last_name}`,
                                    element.email,
                                    element.phone,
                                    element.user_role,
                                    `<img src="${element.profile_pic != null && element.profile_pic != "" ? `${constants.API_URL}/profile_pic/${element.profile_pic}` : `${constants.API_URL}/${constants.NO_IMAGE_PATH}`}" width="80" />`,
                                    `<a class="btn btn-primary" href="/admin/admin-user/change-password?id=${element.user_id}">Change Password</a>`,
                                    `<a class="useraccess_active-dective ${element.status != 0 ? 'text-success' : 'text-danger'}" title="Status" onclick="Activedeactive(${element.user_id},${element.status == 0 ? 1 : 0}, 'admin-user')" style="cursor:pointer;"><i class="fa ${element.status != 0 ? 'fa-eye' : 'fa-eye-slash'}"></i></a> 
                                            <a class="useraccess_update" href="/admin/admin-user/update?id=${element.user_id}" style="cursor:pointer;"><i class="fa fa-pencil"></i></a>
                                            <a class="useraccess_delete" onclick="Delete(${element.user_id}, 'admin-user')" title="Delete" style="cursor:pointer;"><i class="fa fa-trash-o"></i></a>`
                                ])
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

    /* Redirecting to create sub-admin user */
    app.get('/admin/admin-user/create', isLoggedIn, function (req, res) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query("SELECT * FROM roles WHERE id != '0' AND id != '1' AND status != '2' order by name ASC", function (err, rows) {
                if (err) {
                    req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                    res.redirect('/admin/admin-user/index');
                } else {
                    res.render('admin/admin_user/create', {
                        model: [],
                        messages: req.flash('Message'),
                        isNewRecord: 1,
                        session: req.session,
                        roles: rows,
                        fs: fs,// for images
                    });
                }
            });
        });
    });

    /* Redirecting to create sub-admin user page */
    app.get('/admin/admin-user/update', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/admin-user/index');
            } else {
                var role_sql = " SELECT * FROM roles WHERE id != '0' AND id != '1' AND status != '2' order by name ASC";
                connection.query("SELECT u.* FROM user AS u WHERE u.user_id = '" + req.query.id + "' AND u.status != '2' AND u.role_id != '1'  AND u.role_id != '0';" + role_sql, function (err, rows) {
                    res.render('admin/admin_user/create', {
                        model: rows[0][0],
                        messages: req.flash('Message'),
                        isNewRecord: 0,
                        session: req.session,
                        roles: rows[1],
                        fs: fs,// for images
                    });
                });
            }
        });
    });

    /* Create Or Update sub-admin user */
    app.post('/admin/admin-user/save', isLoggedIn, multerUpload.fields([{ 'name': 'profile_pic' }]), function (req, res, next) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/admin-user/index');
            } else {

                var profile_photo = '';
                var t_date = new Date();

                if (typeof (req.files.profile_pic) != "undefined") {
                    var filename = req.files.profile_pic[0].filename;
                    var profile_photo = filename;
                } else {
                    profile_photo = post.old_profile_pic;
                }

                var set_condition = "modified_by= '" + req.user.user_id + "', modified_date= '" + t_date + "'";

                var sql = "SELECT * from user WHERE phone = '" + post.phone + "' AND user_id != '" + post.user_id + "' AND status = 1;";
                sql += "SELECT * from user WHERE email = '" + post.email + "' AND user_id != '" + post.user_id + "' AND status = 1;";


                connection.query(sql, function (err, data) {
                    if (err) {
                        response.status = 0;
                        response.message = err;
                        res.send(response);
                    } else if (data[0].length == 0 && data[1].length == 0) {

                        if (post.old_phone != post.phone) {
                            var phone_data = functions.validateNumber(post.phone);
                            var phone_international = phone_data.international_phone;
                            var phone_national = phone_data.national_phone;
                            var phone_e164 = phone_data.E164_phone;
                        }

                        var phoneData = functions.validateNumber(post.phone);


                        if (post.user_id == 0) {
                            var sql = "INSERT INTO user (role_id, first_name, last_name, email, phone, bio, profile_pic, created_by, created_date) VALUES ?";
                            var values = [
                                [
                                    [post.role_id, post.first_name, post.email, post.phone, post.bio, profile_photo, '1', 'NOW()']
                                ]
                            ];

                            var message = languages.i18n.__('Data Added Successfully')

                        } else {
                            var sql = "UPDATE user SET role_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, bio = ?, profile_pic = ?, modified_by = ?, modified_date = ? WHERE user_id = ? ";
                            var values = [post.role_id, post.first_name, post.last_name, post.email, post.phone, post.bio, profile_photo, '1', 'NOW()', post.user_id]
                            var message = 'Data Updated Successfully';
                        }

                        connection.query(sql, values, function (err, attribute) {
                            if (err) {
                                req.flash('Message', languages.i18n.__('Oops! Something went wrong'));
                                res.render('admin/admin_user/create', {
                                    messages: req.flash('Message'),
                                    isNewRecord: (post.id != 0) ? 0 : 1,
                                    model: post,
                                    session: req.session,
                                    fs: fs,// for images
                                });
                            } else {
                                req.flash('Message', message);
                                res.redirect('/admin/admin-user/index');
                            }
                        });
                    } else {

                        if (data[0].length != 0) {
                            req.flash('Message', languages.i18n.__('Phone number is already exist'));
                        } else {
                            req.flash('Message', languages.i18n.__('Email is already exist.Please choose another email address!'));
                        }

                        connection.query("SELECT u.* FROM user AS u WHERE u.user_id = '" + post.user_id + "' AND u.status != '2' AND u.role_id !='1' AND u.role_id !='0'", function (err, rows) {
                            res.render('admin/admin_user/create', {
                                model: rows[0],
                                message: req.flash('userMessage'),
                                isNewRecord: 0,
                                session: req.session,
                                fs: fs,// for images
                            });
                        });
                    }
                });
            }
        });
    });

    /* Active/Inactive user */
    app.post('/admin/admin-user/activedeactive', function (req, res, next) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                res.json({
                    status: 0,
                    message: languages.i18n.__('Phone number is already exist')
                });
            } else {
                if (req.users_access == 'yes') {
                    connection.query(`UPDATE user SET status = ${req.body.status} WHERE user_id = ${req.body.id}`, function (err, data) {
                        if (err) {
                            res.json({
                                status: 0,
                                message: languages.i18n.__('Phone number is already exist')
                            });
                        }
                        else {
                            // res.redirect('/admin/user/index');
                            res.json({
                                status: 1,
                                message: req.body.status == 1 ? languages.i18n.__("User activated successfully") : languages.i18n.__("User deactivated successfully")
                            });
                        }
                    });
                } else {
                    res.json({
                        status: 0,
                        message: languages.i18n.__('Oops! Something went wrong')
                    });
                }
            }
        });
    });

    /* Delete Sub-admin user */
    app.post('/admin/admin-user/delete', function (req, res, next) {
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                res.json({
                    status: 0,
                    message: languages.i18n.__('Oops! Something went wrong')
                });
            } else {
                if (req.users_access == 'yes') {
                    connection.query("UPDATE user SET status = '2' WHERE user_id = " + req.body.id + " ", function (err, data) {
                        if (err) {
                            res.json({
                                status: 0,
                                message: languages.i18n.__('Oops! Something went wrong')
                            });
                        }
                        else {
                            // res.redirect('/admin/admin-user/index');
                            res.json({
                                status: 1,
                                message: languages.i18n.__("User deleted successfully.")
                            });
                        }
                    });
                } else {
                    // res.redirect('/admin/admin-user/index');
                    res.json({
                        status: 0,
                        message: languages.i18n.__("User deleted successfully.")
                    });
                }
            }
        });
    });

    /* Redirect to change pasword */
    app.get('/admin/admin-user/change-password', isLoggedIn, function (req, res) {
        req.getConnection(function (err, connection) {
            if (err) {
                req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                res.redirect('/admin/admin-user/index');
            } else {
                res.render('admin/admin_user/change-password', {
                    messages: req.flash('Message'),
                    user_id: req.query.id,
                    session: req.session,
                });
            }
        });
    });

    /* Change password */
    app.post('/admin/admin-user/change-password', isLoggedIn, multerUpload.fields([{ 'name': 'profile_photo' }]), function (req, res) {
        var post = req.body;
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        req.getConnection(function (err, connection) {
            if (err) {
                throw err;
            } else {
                connection.query("SELECT * FROM user WHERE user_id = '" + post.user_id + "' AND status != 2 AND role_id != '1' AND role_id != '0'", function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    else {
                        if (rows.length > 0) {
                            var password_hash = rows[0].password_hash;
                            var user_id = rows[0].user_id;
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
                                                    res.redirect('/admin/admin-user/index');
                                                }
                                            });
                                        }
                                    });
                                }
                            });

                        } else {
                            req.flash('error_message', languages.i18n.__('Oops! Something went wrong'));
                            res.redirect('/admin/admin-user/index');
                        }
                    }
                });
            }
        });
    });

    /* Check username or email or phone number exist or not */
    app.post('/admin/admin-user/check-exists', isLoggedIn, function (req, res) {
        var post = req.body;
        response = {};
        var language = (req.cookies.hasOwnProperty('lang')) ? req.cookies.lang : constants.DEFAULT_API_LANGUAGE;
        languages.i18n.setLocale(language);
        var str_cond = "";
        if (typeof (post.user_id) != 'undefined' && post.user_id) {
            str_cond = " AND user_id != '" + post.user_id + "'";
        }

        if (typeof (post.username) != 'undefined' && post.username) {
            req.getConnection(function (err, connection) {
                if (err)
                    throw err;

                connection.query("SELECT * FROM user WHERE (access_id = '" + post.username + "') AND status != '2' AND role_id != '1' AND role_id != '0'" + str_cond, function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    else {
                        if (rows.length > 0) {
                            response.status = 0;
                            response.message = languages.i18n.__('Username already exists');
                            res.send(response);
                        }
                        else {
                            response.status = 1;
                            response.message = languages.i18n.__('Success');
                            res.send(response);
                        }
                    }
                });
            });
        }
        else if (typeof (post.email) != 'undefined' && post.email) {
            req.getConnection(function (err, connection) {
                if (err)
                    throw err;

                connection.query("SELECT * FROM user WHERE (email = '" + post.email + "') AND status != '2' AND role_id != '1' AND role_id != '0'" + str_cond, function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    else {
                        if (rows.length > 0) {
                            response.status = 0;
                            response.message = languages.i18n.__('Email already exists');
                            res.send(response);
                        }
                        else {
                            response.status = 1;
                            response.message = languages.i18n.__('Success');
                            res.send(response);
                        }
                    }
                });
            });
        }
        else if (typeof (post.phone) != 'undefined' && post.phone) {
            validateNumber(post.phone, function (phoneData) {
                req.getConnection(function (err, connection) {
                    if (err)
                        throw err;

                    connection.query("SELECT * FROM user WHERE (phone ='" + post.phone + "' OR phone_international='" + post.phone + "' OR phone_national='" + post.phone + "' OR phone_e164='" + post.phone + "') AND status != '2' AND role_id != '1' AND role_id != '0'" + str_cond, function (err, rows) {
                        if (err) {
                            throw err;
                        }
                        else {
                            if (rows.length > 0) {
                                response.status = 0;
                                response.message = languages.i18n.__('Phone already exists');
                                res.send(response);
                            }
                            else {
                                response.status = 1;
                                response.message = languages.i18n.__('Success');
                                res.send(response);
                            }
                        }
                    });
                });
            });
        }
        else {
            response.status = 1;
            response.message = languages.i18n.__('Success');
            res.send(response);
        }
    });
}

/* route middleware to ensure user is logged in */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

/* Funtion to get Country code, international, national and local number from give phone */
function validateNumber(phone, done) {
    // Require `PhoneNumberFormat`.
    var PNF = require('google-libphonenumber').PhoneNumberFormat;

    // Get an instance of `PhoneNumberUtil`.
    var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

    // Parse number with country code.
    var phoneNumber = phoneUtil.parse(phone, 'US');

    var national_phone = phoneUtil.format(phoneNumber, PNF.NATIONAL);
    var international_phone = phoneUtil.format(phoneNumber, PNF.INTERNATIONAL);
    var E164_phone = phoneUtil.format(phoneNumber, PNF.E164);
    var phone_data = {};
    phone_data = {
        national_phone: national_phone,
        international_phone: international_phone,
        E164_phone: E164_phone
    }
    return done(phone_data);
}