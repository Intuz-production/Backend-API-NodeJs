var express = require('express');
var router = express.Router();
var hash = require('../../pass').hash;
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var fs = require('fs.extra');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var nodemailer = require('nodemailer');
var msg = require('../../config/messages');
var func = require('../../config/functions');
var functions = func.func();
var messages = msg.messages;
var async = require('async');
var thumb = require('node-thumbnail').thumb;
var auth_service = require('../../services/auth');
var eml = require('../../services/email');
var email = eml.func();
const constants = require('../../config/constants');
var locale = require('../../config/configi18n');

var rest = require('restler');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
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
var multerUpload = multer({ storage: storage });

var response = {};
var upload = multer();

router.post('/api/user/videoupload', multerUpload.fields([{ 'name': 'video' }, { 'name': 'video_thumb' }]), function (req, res) {
    var response = {};
    var post = req.body;
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['type'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {

        var filename = req.files.video[0].filename;
        var type = 'video';
        var oldPath = 'uploads/' + filename;

        if (type == 'video') {
            var newPath = 'uploads/video/' + filename;
        } else {
            var newPath = oldPath;
        }

        var filename1 = req.files.video_thumb[0].filename;
        var type1 = 'video_thumb';
        var oldPath1 = 'uploads/' + filename1;

        if (type1 == 'video_thumb') {
            var newPath1 = 'uploads/video/video_thumb/' + filename1;
        } else {
            var newPath1 = oldPath1;
        }

        fs.move(oldPath, newPath, function (err) { // video upload
            if (err) {
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                response.status = 0;
                res.send(response);
            } else {
                fs.move(oldPath1, newPath1, function (err) { // video thumb file upload
                    if (err) {
                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                        response.status = 0;
                        res.send(response);
                    } else {
                        response.message = locale.i18n.__(messages.SUCCESS_MEDIA_UPLOAD);
                        response.status = 1;
                        response.data = { video_filename: filename, video_thumbfile: filename1 };
                        res.send(response);
                    }
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
    response = {};
});

router.post('/api/user/mediaupload', multerUpload.fields([{ 'name': 'media_file' }, { 'name': 'type' }]), function (req, res) {
    var response = {};
    var post = req.body;
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['type'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var filename = req.files.media_file[0].filename;
        var type = req.body.type;
        var oldPath = 'uploads/' + filename;
        if (type == 'profile_pic') {
            var newPath = 'uploads/profile_pic/' + filename;
        } else if (type == 'place_photos') {
            var newPath = 'uploads/place_photos/' + filename;
        } else if (type == 'event_image') {
            var newPath = 'uploads/event_image/' + filename;
        } else if (type == 'video') {
            var newPath = 'uploads/video/' + filename;
        } else if (type == 'video_thumb') {
            var newPath = 'uploads/video/video_thumb/' + filename;
        } else {
            var newPath = oldPath;
        }
        fs.move(oldPath, newPath, function (err) {
            if (err) {
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                response.status = 0;
                res.send(response);
            } else {

                thumbnailc(filename, type, function (result) {
                    // console.log(result);
                });
                response.message = locale.i18n.__(messages.SUCCESS_MEDIA_UPLOAD);
                response.status = 1;
                response.data = { filename: filename };
                res.send(response);
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
    response = {};
});


//pre signup
router.post('/api/user/pre-signup', upload.array(), function (req, res, next) {
    response = {};
    var post = req.body;
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['email', 'phone'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            var email = post.email,
                phone = post.phone;
            //  var phone_international = post.country_code + post.phone;
            //  var phone_national = '0' + post.phone;
            //  var phone_e164 = post.country_code + post.phone;
            // var sql = "SELECT * FROM user WHERE (email = '" + email + "' OR phone = '" + phone + "' OR phone_international = '" + phone + "' OR phone_national = '" + phone + "' OR phone_e164 = '" + phone + "') AND status!='2' AND role_id = '0'";
            connection.query("SELECT * FROM user WHERE (email = '" + email + "' OR phone = '" + phone + "' OR phone_international = '" + phone + "' OR phone_national = '" + phone + "' OR phone_e164 = '" + phone + "') AND status!='2' AND role_id = '0'", function (err, checkemail) {
                if (checkemail.length == 0) {
                    response.status = 1;
                    response.message = locale.i18n.__(messages.SUCCESS);
                    res.send(response);
                } else {
                    if ((checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone_e164 === post.phone) && ((checkemail[0].email).toLowerCase() === (post.email).toLowerCase())) {
                        var msg = locale.i18n.__(messages.EMAIL_AND_PHONE_ALREADY_EXIST);
                    } else if ((checkemail[0].email).toLowerCase() === (post.email).toLowerCase()) {
                        var msg = locale.i18n.__(messages.EMAIL_ALREADY_EXIST);
                    }
                    else if (checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone === post.phone_e164) {
                        var msg = locale.i18n.__(messages.PHONE_ALREADY_EXIST);
                    }

                    response.status = 0;
                    response.message = msg;
                    res.send(response);
                }
            });
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//User sign-up OR social login
router.post('/api/user/social-login', upload.array(), auth_service.isUserActive, function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['social_type', 'social_id'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var profile_pic = "";
        if (typeof (post.profile_pic) != "undefined" && post.profile_pic != "") {
            profile_pic = post.profile_pic;
        }
        var first_name = (typeof (post.first_name) != "undefined" && post.first_name != "") ? post.first_name : "";
        var last_name = (typeof (post.last_name) != "undefined" && post.last_name != "") ? post.last_name : "";
        // var username = (typeof(post.username) != "undefined" && post.username!="") ? post.username : "";
        var email = (typeof (post.email) != "undefined" && post.email != "") ? post.email : "";
        var social_type = post.social_type;
        var social_id = post.social_id;
        var device_type = (typeof (post.device_type) != "undefined" && post.device_type != "") ? post.device_type : "";
        var device_token = (typeof (post.device_token) != "undefined" && post.device_token != "") ? post.device_token : "";
        var phone_data = functions.validateNumber(post.phone);
        var phone_international = phone_data.international_phone;
        var phone_national = phone_data.national_phone;
        var phone_e164 = phone_data.E164_phone;
        var phone = phone_data.number;
        var country_code = phone_data.country_code;
        var mdate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        req.getConnection(function (err, connection) {
            connection.query("SELECT * FROM user WHERE status != '2' AND social_id = '" + social_id + "' AND social_type='" + social_type + "' AND role_id = '0'", function (err, Rows) {
                if (err) {
                    console.log(err);
                    response.status = 0;
                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                    res.send(response);
                } else {
                    if (Rows.length > 0) {
                        if (Rows[0].status == 1) {
                            var condtn = "";
                            if (typeof (post.device_token) != "undefined" && post.device_token != "" && typeof (post.device_type) != "undefined" && post.device_type != "") {
                                condtn = ", device_token = '" + device_token + "', device_type='" + post.device_type + "'";
                            }
                            connection.query("UPDATE user SET first_name = ?, last_name = ?, profile_pic = ?, social_type = ?, social_id = ?, modified_date = NOW()" + condtn + " WHERE user_id = '" + Rows[0].user_id + "'", [first_name, last_name, profile_pic, social_type, social_id], function (err, updateRows) {
                                if (err) {
                                    console.log(err);
                                    response.status = 0;
                                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                    res.send(response);
                                } else {
                                    connection.query("SELECT * FROM user WHERE user_id = '" + Rows[0].user_id + "'", function (err, newuser) {
                                        getUserData(req, newuser, function (result) {
                                            response.status = 1;
                                            response.message = locale.i18n.__(messages.SUCCESS);
                                            result.need_to_complete = 0;
                                            response.data = result;
                                            res.send(response);
                                        });
                                    });
                                }
                            });
                        } else {
                            response.status = 0;
                            response.message = locale.i18n.__(messages.ACCOUNT_INACTIVE);
                            res.send(response);
                        }
                    } else {

                        if (phone && phone != '' && first_name && first_name != '' && last_name && last_name != '' && email && email != '' && country_code && country_code != '') {

                            connection.query("SELECT * FROM user WHERE (email = '" + email + "' OR phone = '" + phone + "' OR phone_international = '" + phone_international + "' OR phone_national = '" + phone_national + "' OR phone_e164 = '" + phone_e164 + "') AND status!='2' AND role_id = '0'", function (err, checkemail) {
                                if (checkemail.length == 0) {
                                    connection.query("INSERT INTO user (role_id, first_name, last_name country_code ,phone, phone_international, phone_national, phone_e164, profile_pic, email, social_id, social_type, device_token , device_type , status, created_by, created_date) VALUES ('0','" + first_name + "', '" + last_name + "', '" + country_code + "', '" + post.phone + "', '" + phone_international + "', '" + phone_national + "', '" + phone_e164 + "','" + profile_pic + "', '" + email + "', '" + social_id + "', '" + social_type + "','" + device_token + "','" + device_type + "','1','','" + mdate + "')", function (err, signup) {
                                        if (err) {
                                            console.log(err);
                                            response.status = 0;
                                            response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                            res.send(response);
                                        } else {
                                            connection.query("SELECT * FROM user WHERE user_id = '" + signup.insertId + "'", function (err, newuser) {
                                                getUserData(req, newuser, function (result) {
                                                    response.status = 1;
                                                    response.message = locale.i18n.__(messages.SUCCESS);
                                                    response.data = result;
                                                    res.send(response);
                                                });
                                            });
                                        }
                                    });

                                } else {

                                    if ((checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone_e164 === post.phone) && (checkemail[0].email === post.email)) {
                                        var msg = locale.i18n.__(messages.EMAIL_AND_PHONE_ALREADY_EXIST);
                                    } else if (checkemail[0].email === post.email) {
                                        var msg = locale.i18n.__(messages.EMAIL_ALREADY_EXIST);
                                    }
                                    else if (checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone === post.phone_e164) {
                                        var msg = locale.i18n.__(messages.PHONE_ALREADY_EXIST);
                                    }
                                    response.status = 0;
                                    response.message = msg;
                                    res.send(response);
                                }
                            });


                        } else {
                            response.status = 1;
                            response.message = locale.i18n.__(messages.SOCIAL_MESSAGE);
                            response.data = { need_to_complete: 1 };
                            res.send(response);
                        }
                    }
                }
            });
        });
    }
    else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

/**
 * User Login
 * Update device type and token
 * @requires,  phone, password
 * @returns, user's detail
 */
router.post('/api/user/login', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['phone', 'password'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var phone = post.phone;
        var password = post.password;
        var device_type = "";
        var device_token = "";

        req.getConnection(function (err, connection) {
            connection.query("SELECT u.* FROM user AS u WHERE ((u.phone ='" + phone + "' OR u.email ='" + phone + "' ) OR u.phone_international ='" + phone + "' OR u.phone_national ='" + phone + "' OR u.phone_e164 ='" + phone + "') AND u.status = 1 AND u.role_id='0'", function (err, rows) {
                if (err) {
                    console.log("Error ", err);
                    response.status = 0;
                    response.message = locale.i18n.__(messages.OOPS);
                    res.send(response);
                } else {
                    if (rows.length > 0) {

                        var password_hash = rows[0].password;
                        var user_id = rows[0].user_id;

                        // Load hash from your password DB.
                        bcrypt.compare(password, password_hash, function (err, result) {
                            if (err) {
                                console.log(err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.OOPS);
                                res.send(response);
                            } else if (result === true) {
                                if (typeof (req.body.device_type) != 'undefined' && typeof (req.body.device_token) != 'undefined') {

                                    var sql = "UPDATE user SET device_type = ?, device_token = ? WHERE user_id = ? ";
                                    var values = [req.body.device_type, req.body.device_token, user_id];

                                    connection.query(sql, values, function (err, data) {
                                        if (err) {
                                            console.log(err);
                                            response.status = 0;
                                            response.message = locale.i18n.__(messages.OOPS);
                                            res.send(response);
                                        }
                                    });
                                }
                                getUserData(req, rows, function (result) {
                                    result.device_type = req.body.device_type;
                                    result.device_token = req.body.device_token;

                                    response.status = 1;
                                    response.message = locale.i18n.__(messages.SUCCESS);
                                    response.data = result;
                                    res.send(response);
                                });
                            } else {
                                console.log("Error ", err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.INVALID_EMAIL_PASSWORD);
                                res.send(response);
                            }
                            // res === true
                        });
                    } else {
                        response.status = 0;
                        response.message = locale.i18n.__(messages.INVALID_USR);
                        res.send(response);
                    }
                }
            });
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

/**
 * User Sign Up
 * User Role Define in the api
 * @requires, email, phone, password, first_name, last_name
 * @returns, Signup user's detail
 */

router.post('/api/user/signup', upload.array(), function (req, res, next) {
    response = {};
    var post = req.body;
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['email', 'phone', 'password', 'first_name', 'last_name'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        bcrypt.genSalt(10, function (err, salt) {
            console.log("salt for hash generated");
            if (err) {
                //return next(err);
                console.log(err);
                response.status = 0;
                response.message = err;
                res.send(response);
            } else {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    if (err) {
                        //return next(err);
                        console.log(err);
                        response.status = 0;
                        response.message = err;
                        res.send(response);
                    } else {

                        req.getConnection(function (err, connection) {
                            if (err) {
                                console.log(err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.DATABASE_CONNECTION_ERR);
                                res.send(response);
                            } else {

                                var password_hash = hash;
                                var device_type = (post.device_type != '' && typeof (post.device_type) != 'undefined') ? post.device_type : "";
                                var device_token = (post.device_token != '' && typeof (post.device_token) != 'undefined') ? post.device_token : "";
                                var bio = (post.bio != '' && typeof (post.bio) != 'undefined') ? post.bio : "";
                                var phone_data = functions.validateNumber(post.phone);
                                var phone_international = phone_data.international_phone;
                                var phone_national = phone_data.national_phone;
                                var phone_e164 = phone_data.E164_phone;
                                var phone = phone_data.number;
                                var country_code = phone_data.country_code;
                                var email = post.email;
                                var first_name = post.first_name;
                                var last_name = post.last_name;
                                var role = "0";


                                var query = "SELECT * FROM user WHERE (email = BINARY '" + email + "' OR phone = '" + phone + "' OR phone_international = '" + phone_international + "' OR phone_national = '" + phone_national + "' OR phone_e164 = '" + phone_e164 + "') AND status!='2' "; //

                                connection.query(query, function (err, checkemail) {
                                    if (checkemail.length == 0) {
                                        //hash(post.password.toString(), function (err, salt_it_new, hash_it_new) {
                                        var mdate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

                                        var sql = "INSERT INTO user (first_name,last_name, email, bio, password, country_code ,phone, phone_international, phone_national, phone_e164, device_type, device_token, role_id, created_by, created_date) VALUES ?";

                                        var values = [
                                            [
                                                [first_name, last_name, email, bio, password_hash, country_code, phone, phone_international, phone_national, phone_e164, device_type, device_token, role, '1', mdate]
                                            ]
                                        ];

                                        connection.query(sql, values, function (err, data) {
                                            if (err) {
                                                console.log(err);
                                                response.status = 0;
                                                response.message = locale.i18n.__(messages.OOPS);
                                                res.send(response);
                                            } else {
                                                var userdata;
                                                connection.query("SELECT u.* FROM user AS u WHERE u.email = BINARY '" + email + "' AND u.status = '1' AND u.role_id = '0'", function (err, userinfo) {
                                                    if (err) {
                                                        console.log(err);
                                                        response.status = 0;
                                                        response.message = locale.i18n.__(messages.UNABLE_TO_FETCH);
                                                        res.send(response);
                                                    } else {
                                                        getUserData(req, userinfo, function (result) {
                                                            result.device_type = device_type;
                                                            result.device_token = device_token;
                                                            response.status = 1;
                                                            response.message = locale.i18n.__(messages.SIGNUP_SUCCESS);
                                                            response.data = result;
                                                            res.send(response);
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        var msg = "";
                                        if ((checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone_e164 === post.phone) && (checkemail[0].email === post.email)) {
                                            var msg = locale.i18n.__(messages.EMAIL_AND_PHONE_ALREADY_EXIST);
                                        } else if (checkemail[0].email === post.email) {
                                            var msg = locale.i18n.__(messages.EMAIL_ALREADY_EXIST);
                                        }
                                        else if (checkemail[0].phone === post.phone || checkemail[0].phone_international === post.phone || checkemail[0].phone_national === post.phone || checkemail[0].phone === post.phone_e164) {
                                            var msg = locale.i18n.__(messages.PHONE_ALREADY_EXIST);
                                        }
                                        response.status = 0;
                                        response.message = msg;
                                        res.send(response);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//change password
router.post('/api/user/changepassword', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['user_id', 'oldpassword', 'newpassword'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.DATABASE_CONNECTION_ERR);
                res.send(response);
            } else {
                connection.query("SELECT  COUNT(*) as cnt FROM user WHERE user_id = '" + post.user_id + "' AND status!='2' AND role_id = '0'", function (err, checkuser) {
                    if (checkuser[0].cnt > 0) {
                        connection.query("SELECT * FROM user WHERE user_id = '" + post.user_id + "' AND status!='2' AND role_id = '0'", function (err, rows) {
                            if (err) {
                                console.log(err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.NO_USER);
                                res.send(response);
                            } else {
                                if (rows.length > 0) {
                                    var password_hash = rows[0].password;
                                    var user_id = rows[0].id;

                                    // Load hash from your password DB.
                                    bcrypt.compare(post.oldpassword, password_hash, function (err, result) {
                                        if (err) {
                                            console.log(err);
                                            response.status = 0;
                                            response.message = locale.i18n.__(messages.OOPS);
                                            res.send(response);
                                        } else if (result === true) {
                                            bcrypt.genSalt(10, function (err, salt) {
                                                if (err) {
                                                    //return next(err);
                                                    console.log(err);
                                                    response.status = 0;
                                                    response.message = err;
                                                    res.send(response);
                                                } else {
                                                    bcrypt.hash(post.newpassword, salt, function (err, hash) {
                                                        if (err) {
                                                            console.log(err);
                                                            response.status = 0;
                                                            response.message = locale.i18n.__(messages.OOPS);
                                                            res.send(response);
                                                        } else {
                                                            connection.query("UPDATE user SET password = '" + hash + "' WHERE user_id = '" + post.user_id + "' AND role_id = '0'", function (err, data) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    response.status = 0;
                                                                    response.message = locale.i18n.__(messages.OOPS);
                                                                    res.send(response);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                            response.status = 1;
                                            response.message = locale.i18n.__(messages.SUCCESS);
                                            //response.data = rows[0];
                                            res.send(response);
                                        } else {
                                            console.log("Error ", err);
                                            response.status = 0;
                                            response.message = locale.i18n.__(messages.INVALID_EMAIL_PASSWORD);
                                            res.send(response);
                                        }
                                        // res === true
                                    });
                                } else {
                                    response.status = 0;
                                    response.message = locale.i18n.__(messages.INVALID_USR);
                                    res.send(response);
                                }
                            }
                        });
                    } else {
                        response.status = 0;
                        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM);
                        res.send(response);
                    }
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

router.post('/api/user/forgotpassword', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['email'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var user_email = post.email;

        req.getConnection(function (err, connection) { //role_id = '0' for app users 

            connection.query("SELECT u.* FROM user AS u WHERE u.status = 1 AND u.role_id = '0' AND email = '" + user_email + "'", function (err, rows) {
                if (err) {
                    response.status = 0;
                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                    res.send(response);
                }
                else {
                    if (rows.length > 0) {
                        var passwordResetToken = bcrypt.genSaltSync(25);
                        var sql = "UPDATE `user` SET password_reset_token=? WHERE user_id = ?";
                        var values = [passwordResetToken, rows[0].user_id];
                        connection.query(sql, values, function (err, updateResetToken) {
                            if (err) {
                                console.log(err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                res.send(response);
                            }
                            else {
                                //email-start
                                var sql = "SELECT * FROM `email_template` WHERE emailtemplate_id = 2; ";
                                connection.query(sql, function (err, email_template) {
                                    if (err) {
                                        response.status = 0;
                                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                        res.send(response);
                                    } else {

                                        if (rows[0].last_name == null || rows[0].last_name == '') {
                                            rows[0].last_name = '';
                                        }

                                        var html = email_template[0].emailtemplate_body;
                                        var html = html.replace(/{first_name}/gi, rows[0].first_name);
                                        var html = html.replace(/{last_name}/gi, rows[0].last_name);
                                        var html = html.replace(/{url}/gi, "" + req.headers.host + "/admin/resetpassword?token=" + passwordResetToken + " ");
                                        var data = { to: rows[0].email, subject: email_template[0].emailtemplate_subject, html: html };
                                        email.send_mail(req, data, function (result) {
                                            response.status = 1;
                                            response.message = locale.i18n.__(messages.SUCCESS);
                                            res.send(response);
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        response.status = 0;
                        response.message = locale.i18n.__(messages.USER_NOT_FOUND);//locale.i18n.__('User not available');
                        res.send(response);
                    }
                }
            });
        });
    }
    else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//Check phone and email
router.post('/api/user/check-phone', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['phone'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (typeof (post.phone) != 'undefined' && post.phone != "") {
        validateNumber(post.phone, function (phoneData) {
            req.getConnection(function (err, connection) {
                if (err)
                    throw err;

                connection.query("SELECT * FROM user WHERE (phone ='" + post.phone + "' OR phone_international ='" + phoneData.international_phone + "' OR phone_national ='" + phoneData.national_phone + "' OR phone_e164 ='" + phoneData.E164_phone + "') AND status = 1  AND role_id = '0'", function (err, rows) {
                    if (err) {
                        console.log("Error ", err);
                        response.status = 0;
                        response.message = locale.i18n.__(messages.OOPS);
                        res.send(response);
                    } else {
                        if (rows.length > 0) {
                            response.status = 0;
                            response.message = locale.i18n.__(messages.PHONE_ALREADY_EXIST);
                            res.send(response);
                        } else {

                            response.status = 1;
                            response.message = locale.i18n.__(messages.SUCCESS);
                            res.send(response);
                        }
                    }
                });
            });
        });
    } else if (typeof (post.email) != "undefined" && post.email != "") {
        req.getConnection(function (err, connection) {
            if (err)
                throw err;
            connection.query("SELECT * FROM user WHERE email ='" + post.email + "' AND status = 1 AND role_id = '0'", function (err, rows) {
                if (err) {
                    console.log("Error ", err);
                    response.status = 0;
                    response.message = locale.i18n.__(messages.OOPS);
                    res.send(response);
                } else {
                    if (rows.length > 0) {
                        response.status = 0;
                        response.message = locale.i18n.__(messages.EMAIL_ALREADY_EXIST);
                        res.send(response);
                    } else {
                        response.status = 1;
                        response.message = locale.i18n.__(messages.SUCCESS);
                        res.send(response);
                    }
                }
            });
        });
    } else {
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM);
        res.send(response);
    }
});

//Update devicetype and devicetoken for push notification
router.post('/api/user/save-token', isUserActive, upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['user_id', 'device_type', 'device_token'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var user_array = [post.user_id];

        auth_service.func().user_auth(req, user_array, function (auth_result) {
            req.getConnection(function (err, connection) {
                if (err) {
                    console.log(err);
                    response.status = 0;
                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                    res.send(response);
                }
                else {
                    connection.query("UPDATE user SET device_token = '" + post.device_token + "', device_type = '" + post.device_type + "', modified_date = NOW() WHERE user_id = ?", [post.user_id], function (err, udata) {
                        if (err) {
                            console.log(err);
                            response.status = 0;
                            response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                            res.send(response);
                        } else {
                            response.status = 1;
                            response.message = locale.i18n.__(messages.SUCCESS);
                            res.send(response);
                        }
                    })
                }
            });
        });

    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//User Edit profile
router.post('/api/user/editprofile', isUserActive, upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['user_id'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            }
            else {
                var params = [];
                var mdate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

                var set_condition = "modified_date= '" + mdate + "'";
                var whr_arr = {};
                if (post.first_name && post.first_name != '') {
                    set_condition += ", first_name=?";
                    whr_arr.first_name = post.first_name;
                }
                if (post.last_name && post.last_name != '') {
                    set_condition += ", last_name=?";
                    whr_arr.last_name = post.last_name;
                }
                if (post.address && post.address != '') {
                    set_condition += ", address=?";
                    whr_arr.address = post.address;
                }
                if (post.latitude && post.latitude != '') {
                    set_condition += ", latitude=?";
                    whr_arr.latitude = post.latitude;
                }
                if (post.longitude && post.longitude != '') {
                    set_condition += ", longitude=?";
                    whr_arr.longitude = post.longitude;
                }
                if (post.bio && post.bio != '') {
                    set_condition += ", bio=?";
                    whr_arr.bio = post.bio;
                }
                if (post.artwork_style_id && post.artwork_style_id != '') {
                    set_condition += ", artwork_style_id=?";
                    whr_arr.artwork_style_id = post.artwork_style_id;
                }
                if (post.profile_banner_photo && post.profile_banner_photo != 'undefined') {
                    set_condition += ", profile_banner_photo=?";
                    whr_arr.profile_banner_photo = post.profile_banner_photo;
                }
                if (post.deviant_url && post.deviant_url != '') {
                    set_condition += ", deviant_url=?";
                    whr_arr.deviant_url = post.deviant_url;
                }
                if (post.artstation_url && post.artstation_url != '') {
                    set_condition += ", artstation_url=?";
                    whr_arr.artstation_url = post.artstation_url;
                }
                if (post.personal_site_url && post.personal_site_url != '') {
                    set_condition += ", personal_site_url=?";
                    whr_arr.personal_site_url = post.personal_site_url;
                }
                if (post.instgram_url && post.instgram_url != '') {
                    set_condition += ", instgram_url=?";
                    whr_arr.instgram_url = post.instgram_url;
                }
                if (typeof (post.birthdate) != 'undefined') {
                    if (post.birthdate != '') {
                        var bdate = new Date(post.birthdate);
                        var birth = bdate.getFullYear() + "-" + (bdate.getMonth() + 1) + "-" + bdate.getDate();
                        params.push("birthdate = '" + birth + "'");
                    } else {
                        params.push('birthdate = "0000-00-00"');
                    }
                }
                if (typeof (post.profile_pic) != 'undefined') {
                    set_condition += ", profile_pic=?";
                    whr_arr.profile_pic = post.profile_pic;
                }

                // if (params.length > 0) {
                var paramsQ = params.join(' , ');
                var sql = "UPDATE user SET modified_date='" + mdate + "', ?  WHERE user_id = " + Number(post.user_id);
                connection.query(sql, whr_arr, function (err, r) {
                    if (err) {
                        console.log(err);
                        response.status = 0;
                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                        res.send(response);
                    } else {
                        var q = "SELECT u.* FROM user AS u WHERE u.user_id = '" + post.user_id + "'";
                        connection.query(q, function (err, user) {
                            if (err) {
                                console.log(err);
                            } else {
                                getUserData(req, user, function (result) {
                                    response.data = result;
                                });
                                response.status = 1;
                                response.message = locale.i18n.__(messages.SUCCESS_PROFILE_UPDATED);
                                res.send(response);
                            }
                        })
                    }
                });
                // } else {
                //     response.status = 1;
                //     response.message = messages.SUCCESS_PROFILE_UPDATED;
                //     res.send(response);
                // }

            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//Get user profile info. Param - user_id
router.post('/api/user/get-profile-info', isUserActive, upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['user_id'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;

    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            } else {
                var userdata = {};
                var card_details = [];
                async.parallel([
                    function (callback1) {
                        connection.query("SELECT * FROM user WHERE user_id='" + post.user_id + "'", function (err, rows) {
                            if (err) {
                                callback1();
                            } else {
                                getUserData(req, rows, function (result) {
                                    userdata = result;
                                    callback1();
                                });
                            }
                        });
                    },
                ], function (err) {
                    if (err) {
                        response.status = 0;
                        response.message = locale.i18n.__(messages.OOPS) + err;
                    } else {
                        userdata.card_data = card_details;
                        response.data = userdata;
                        response.status = 1;
                        response.message = messages.SUCCESS;
                    }
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

Array.prototype.diff = function (arr2) {
    var ret = [];
    this.sort();
    arr2.sort();
    for (var i = 0; i < this.length; i += 1) {
        if (arr2.indexOf(this[i]) > -1) {
            ret.push(this[i]);
        }
    }
    return ret;
};

//Get name from cms such as country, city etc..
router.post('/api/user/getmasterlist', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['type'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            }
            else {
                connection.query("SELECT a.id, a.name FROM `" + post.type + "` as a WHERE a.status = '1' ", function (err, rows) {
                    if (err) {
                        console.log(err);
                        response.status = 0;
                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                        res.send(response);
                    } else {
                        var data = [];
                        if (rows.length > 0) {
                            //for(var i = 0; i < rows.length; i++) {
                            async.forEachOf(rows, function (value, key, callback) {
                                var result = {};
                                if (typeof (post.user_id) != "undefined" && post.user_id > 0 && post.type == "categories") {
                                    connection.query("SELECT * FROM user WHERE FIND_IN_SET('" + value.id + "', category_ids) > 0 AND user_id = '" + post.user_id + "' AND category_ids IS NOT NULL", function (err, user_rows) {
                                        if (err) {
                                            console.log(err);
                                            response.status = 0;
                                            response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                            res.send(response);
                                        } else {
                                            if (user_rows.length > 0) {
                                                result.is_selected = 1;
                                            } else {
                                                result.is_selected = 0;
                                            }
                                            result.id = parseInt(value.id);
                                            result.name = (value.name).toString();
                                            data.push(result);
                                            callback();
                                        }
                                    });
                                } else {
                                    result.is_selected = 0;
                                    result.id = parseInt(value.id);
                                    result.name = (value.name).toString();
                                    data.push(result);
                                    callback();
                                }
                            }, function (err) {
                                if (err) {
                                    response.status = 0;
                                    response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                    res.send(response);
                                } else {
                                    response.status = 1;
                                    response.message = locale.i18n.__(messages.SUCCESS);
                                    response.data = data;
                                    res.send(response);
                                }
                            });
                        } else {
                            response.status = 1;
                            response.message = locale.i18n.__(messages.SUCCESS);
                            response.data = data;
                            res.send(response);
                        }
                    }
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//Fetch notification list with pagination
router.post('/api/user/getnotificationlist', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['user_id', 'page'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            }
            else {
                var page = post.page;
                var limit = 15;
                var skip = page * limit;
                var updateQ = "UPDATE notifications SET is_read = 1 WHERE user_id = " + post.user_id;
                connection.query(updateQ, function (err, data) {
                    if (err) {
                        console.log(err);
                        response.status = 0;
                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                        res.send(response);
                    } else {
                        connection.query("SELECT * FROM notifications WHERE user_id = " + Number(post.user_id), function (err, rowcount) {
                            if (err) {
                                console.log(err);
                                response.status = 0;
                                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                res.send(response);
                            } else {
                                connection.query("SELECT * FROM notifications WHERE user_id = " + Number(post.user_id) + " ORDER BY modified_date DESC limit " + skip + "," + limit, function (err, rows) {
                                    if (err) {
                                        console.log(err);
                                        response.status = 0;
                                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                                        res.send(response);
                                    } else {
                                        var data = [];
                                        if (rows.length > 0) {
                                            for (var i = 0; i < rows.length; i++) {
                                                var result = {};
                                                result.id = rows[i]['id'];
                                                result.parent_id = (rows[i]['parent_id'] != null) ? parseInt(rows[i]['parent_id']) : 0;
                                                result.message = rows[i]['message'];
                                                result.type = rows[i]['type'];
                                                result.date = (new Date(rows[i]['modified_date'])).getTime() / 1000;
                                                data.push(result);
                                            }
                                        }
                                        response.status = 1;
                                        response.totalCount = rowcount.length;
                                        response.message = locale.i18n.__(messages.SUCCESS);
                                        response.data = data;
                                        res.send(response);
                                    }
                                });
                            }
                        });
                    }
                })
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//Delete notifications
router.post('/api/user/delete-notification', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var required_params = ['notification_id'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            }
            else {
                var updateQ = "DELETE FROM notifications WHERE id = " + post.notification_id;
                connection.query(updateQ, function (err, data) {
                    if (err) {
                        console.log(err);
                        response.status = 0;
                        response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                        res.send(response);
                    } else {
                        response.status = 1;
                        response.message = locale.i18n.__(messages.SUCCESS);
                        res.send(response);
                    }
                })
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//update push notification
router.post('/api/user/update-setting', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var data = [];
    var result = {};
    var required_params = ['user_id', 'type', 'status'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var language = post.language;
        req.getConnection(function (err, connection) {
            if (err) {
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            } else {
                if (post.type == "push_notification") {
                    var conditions = "push_notification = '" + post.status + "' ";
                }
                var sql = "UPDATE user SET " + conditions + " WHERE user_id='" + post.user_id + "'";
                connection.query(sql, function (err, rowdata) {
                    if (err)
                        throw err;
                    response.status = 1;
                    response.message = locale.i18n.__(messages.SUCCESS);
                    res.send(response);
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

//update categories
router.post('/api/user/update-categories', upload.array(), function (req, res, next) {
    var post = req.body;
    response = {};
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    var data = [];
    var result = {};
    var required_params = ['user_id', 'category_ids'];
    var elem = functions.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var language = post.language;
        req.getConnection(function (err, connection) {
            if (err) {
                response.status = 0;
                response.message = locale.i18n.__(messages.ERROR_PROCESSING);
                res.send(response);
            } else {

                var sql = "UPDATE user SET category_ids='" + post.category_ids + "' WHERE user_id='" + post.user_id + "'";
                connection.query(sql, function (err, rowdata) {
                    if (err)
                        throw err;
                    response.status = 1;
                    response.message = locale.i18n.__(messages.SUCCESS);
                    res.send(response);
                });
            }
        });
    } else {
        var str = functions.loadErrorTemplate(elem);
        response.status = 0;
        response.message = locale.i18n.__(messages.WRONG_MISSING_PARAM) + str;
        res.send(response);
    }
});

router.post('/api/user/sendMail', upload.array(), function (req, res, next) {
    var language = (post.language && typeof (post.language) != 'undefined') ? post.language : constants.DEFAULT_API_LANGUAGE;
    locale.i18n.setLocale(language);
    req.getConnection(function (err, connection) {
        if (err) {
            res.send({
                status: 0,
                message: locale.i18n.__(messages.OOPS)
            });
        } else {
            var sql = "select * from email_template where emailtemplate_id = 1";
            connection.query(sql, function (err, rowdata) {
                if (err) {
                    console.log("Error : ", err);
                }
                else {

                    let email_body = rowdata[0].emailtemplate_body;
                    email_body = email_body.replace(/{first_name}/gi, "Abhi");
                    email_body = email_body.replace(/{last_name}/gi, "Thakkar");
                    email_body = email_body.replace(/{email}/gi, "abhi.t@virtualveb.com");//rows[0].email

                    email.sendMail("testprojdev@gmail.com", "abhi.t@virtualveb.com", rowdata[0].emailtemplate_subject, email_body, ``, function (err) {
                        if (err) {
                            console.log("Error while sending mail.", err);
                        }
                        else {
                            response.status = 1;
                            response.message = locale.i18n.__(messages.SUCCESS);
                            res.json({
                                status: 1,
                                message: locale.i18n.__(messages.EMAIL_SENT)
                            });
                        }
                    });
                }
            });
        }
    });
});


//Fetch User function
function fetchUser(req, done) {
    req.getConnection(function (err, connection) {
        connection.query("SELECT * FROM user WHERE email ='" + req.body.email + "' AND status = 1 AND role_id = '0'", function (err, rows) {
            if (err) {
                console.log("Error ", err);
                response.status = 0;
                response.message = locale.i18n.__(messages.OOPS);
                res.send(response);
            } else {
                if (rows.length > 0) {
                    done(rows);
                } else {
                    done(false);
                }
            }
        });
    });
}

//Get user details
function getUserData(req, rows, done) {
    var userData = {};
    if (rows[0].profile_pic != null) {
        var exp_fn = rows[0].profile_pic.split('.');
        var thumbimg = exp_fn[0] + "_thumb." + exp_fn[1];
    }
    userData = {
        user_id: parseInt(rows[0].user_id),
        role: rows[0].role_id,
        first_name: (rows[0].first_name != null) ? rows[0].first_name : "",
        last_name: (rows[0].last_name != null) ? rows[0].last_name : "",
        email: (rows[0].email != null) ? rows[0].email : "",
        phone: (rows[0].phone != null) ? rows[0].phone : "",
        profile_pic: (rows[0].profile_pic != null && rows[0].profile_pic != "") ? "http://" + req.headers.host + "/profile_pic/" + rows[0].profile_pic : "",
        profile_pic_thumb: (rows[0].profile_pic != null && rows[0].profile_pic != "") ? "http://" + req.headers.host + "/profile_pic/thumb/" + thumbimg : "",
        //base_url: "http://" + req.headers.host + "/profile/",
        device_type: (rows[0].device_type != null) ? rows[0].device_type : "",
        device_token: (rows[0].device_token != null) ? rows[0].device_token : "",
        social_type: (rows[0].social_type != null) ? rows[0].social_type : "",
        social_id: (rows[0].social_id != null) ? rows[0].social_id : "",
        user_type: rows[0].user_type, // 1= user ,2= artist
        push_notification: parseInt(rows[0].push_notification), //0=off,1=on
    };
    return done(userData);
}

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

function thumbnailc(name, dir, call) {
    thumb({
        source: path.join(__dirname, '../../uploads/' + dir + '/') + name, // could be a filename: dest/path/image.jpg
        destination: path.join(__dirname, '../../uploads/' + dir + '/thumb'),
        concurrency: 1,
        width: 150,
        height: 150,
    }, function (files, err, stdout, stderr) {
        if (err) {
            throw err;
        }
        return call();
    });
}

module.exports = router;

// route middleware to ensure user is valid
function isUserActive(req, res, next) {
    var post = req.body;
    var userid = 0;
    var response = {};
    if (typeof (post.login_user_id) != "undefined" && post.login_user_id > 0) {
        userid = post.login_user_id;
    } else if (typeof (post.user_id) != "undefined" && post.user_id > 0) {
        userid = post.user_id;
    }
    if (userid > 0) {
        req.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                throw err;
            } else {
                var sql = "SELECT status FROM user WHERE user_id = '" + userid + "'";
                connection.query(sql, function (err, rows) {
                    if (err) {
                        console.log(err);
                        throw err;
                    } else {
                        if (rows.length > 0) {
                            if (rows[0].status == 0) {
                                response.status = -1;
                                response.message = locale.i18n.__(messages.ACCOUNT_INACTIVE);
                                res.send(response);
                            } else if (rows[0].status == 2) {
                                response.status = -1;
                                response.message = locale.i18n.__(messages.ACCOUNT_DELETE);;
                                res.send(response);
                            } else {
                                return next();
                            }
                        } else {
                            response.status = -1;
                            response.message = locale.i18n.__(messages.INVALID_USR);
                            res.send(response);
                        }
                    }
                });
            }
        });
    } else {
        return next();
    }
}
