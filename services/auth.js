var msg = require('../config/messages');
var messages = msg.messages;
var async = require('async');


/* Function to check user is active or not */
exports.isUserActive = function (req, res, next) {

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
                                response.message = messages.ACCOUNT_INACTIVE;
                                res.send(response);
                            } else if (rows[0].status == 2) {
                                response.status = -1;
                                response.message = messages.ACCOUNT_DELETE;
                                res.send(response);
                            } else {
                                return next();
                            }
                        } else {
                            response.status = -1;
                            response.message = messages.USER_NOT_EXIST;
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