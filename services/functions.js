var FCM = require('fcm-push');
var moment = require('moment');
exports.func = function () {
    return {
        /* function to check whether required req param is exist in post or not*/
        validateReqParam: function (post, reqparam) {
            var remain = [];
            var req = [];
            for (var i = 0; i < reqparam.length; i++) {
                if (typeof post[reqparam[i]] != 'undefined') {
                    if (post[reqparam[i]] == '') {
                        req.push(reqparam[i]);
                    }
                } else {
                    remain.push(reqparam[i]);
                }
            }
            var respose = { 'missing': remain, 'blank': req };
            return respose;
        },
        /* function to load error message template for blank/missing req params for all APIs*/
        loadErrorTemplate: function (elem) {
            var missing = elem.missing;
            var blank_str = '', missing_str = '';
            if (missing.length > 0) {
                missing_str = missing.join(',');
                missing_str += ' missing';
            }
            var blank = elem.blank;
            if (blank.length > 0) {
                blank_str = blank.join(',');
                blank_str += ' should not be blank';
            }
            var s = [missing_str, blank_str];
            var str = s.join(' \n ');
            return str;
        },


        /* function to load error message template for blank/missing req params for all APIs*/
        validateNumber: function (phone) {
            if (typeof phone != "undefined" && phone != "") {
                // Require `PhoneNumberFormat`.
                var PNF = require('google-libphonenumber').PhoneNumberFormat;

                // Get an instance of `PhoneNumberUtil`.
                var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

                // Parse number with country code.
                var phoneNumber = phoneUtil.parse(phone, 'US');
                var national_phone = phoneUtil.format(phoneNumber, PNF.NATIONAL);
                var international_phone = phoneUtil.format(phoneNumber, PNF.INTERNATIONAL);
                var E164_phone = phoneUtil.format(phoneNumber, PNF.E164);
                var RFC3966 = phoneUtil.format(phoneNumber, PNF.RFC3966);
                var phone_data = {};
                phone_data = {
                    national_phone: (national_phone.indexOf(' ') >= 0) ? national_phone.replace(/\s/g, "") : national_phone,
                    international_phone: (international_phone.indexOf(' ') >= 0) ? international_phone.replace(/\s/g, "") : international_phone,
                    number: (phoneNumber.values_)[2],
                    country_code: (phoneNumber.values_)[1],
                    E164_phone: E164_phone,
                    RFC3966: RFC3966
                }
                return phone_data;
            }
            else {
                return {}
            }
        },


        pushNotification: function (connection, id, param2, msg, sender_id, receiver_id) {

            var response = {};
            var sql = "SELECT * FROM user WHERE id = '" + sender_id + "' AND status = 1;SELECT * FROM user WHERE id = '" + receiver_id + "' AND status = 1";
            connection.query(sql, function (err, rows) {
                if (err) {
                    response.status = 0;
                    //                response.message = messages.ERROR_PROCESSING;
                    return response;
                }
                else {
                    if (rows.length > 0) {

                        if (rows[0].length > 0 && rows[1].length > 0) {
                            var sender_detail = rows[0][0];
                            var receiver_detail = rows[1][0];
                            var device_token = receiver_detail.device_token;
                            var device_type = receiver_detail.device_type;
                            var message = (msg).replace(/{sender_name}/gi, sender_detail.first_name + '' + ((sender_detail.last_name != '') ? ' ' + sender_detail.last_name + '' : ''));
                            var message = message.replace(/{receiver_name}/gi, receiver_detail.first_name + '' + ((receiver_detail.last_name != '') ? ' ' + receiver_detail.last_name + '' : ''));
                            var fcm = new FCM(serverKey);

                            var param1 = {
                                'notification_from': sender_id,
                                'notification_from_first_name': sender_detail.first_name,
                                'notification_from_last_name': sender_detail.last_name,
                                'notification_to': receiver_id,
                                'notification_to_first_name': receiver_detail.first_name,
                                'notification_to_last_name': receiver_detail.last_name,
                                'message': message
                            };
                            var data = merge_objects(param1, param2);

                            var sql = "INSERT INTO notification_generalization (primary_id, notification_from, notification_to, notification_type, notification_text, created_by, created_date) VALUES ?";
                            var values = [
                                [id, data.notification_from, data.notification_to, data.notification_type, data.message, data.notification_from, moment().utc().format('YYYY-MM-DD HH:mm:ss')]
                            ];
                            connection.query(sql, [values], function (err, placeData) {
                                //                                  if (err) {
                                //                                        console.log(err)
                                //                                  } else {
                                //                                        console.log(resp)
                                //                                  }
                            });

                            if (typeof device_type != 'undefined' && device_type.toLowerCase() == "android") {
                                var message = {
                                    to: device_token, // required fill with device token or topics
                                    data: data,
                                };
                                fcm.send(message, function (err, resp) {
                                    //                            if (err) {
                                    //                                console.log(err)
                                    //                            } else {
                                    //                                console.log(resp)
                                    //                            }
                                });
                            } else if (typeof device_type != 'undefined' && device_type.toLowerCase() == "ios") {

                                var message = {
                                    to: device_token, // required fill with device token or topics
                                    data: data,
                                    notification: {
                                        title: '',
                                        body: data.message
                                    }
                                };
                                fcm.send(message, function (err, resp) {
                                    //                            if (err) {
                                    //                                console.log(err)
                                    //                            } else {
                                    //                                console.log(resp)
                                    //                            }
                                });
                            }
                        }
                    }
                }
            });
        }
    };
}
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
/*
 * remove duplicate values
 */
Array.prototype.unique = function () {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

/*
 * removes item from array
 */
Array.prototype.removeArrayItem = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}

/*
 * merge two objects
 * override values of first object if key is common
 */
function merge_objects(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}


Array.prototype.sortOn = function (key) {
    this.sort(function (a, b) {
        if (a[key] < b[key]) {
            return -1;
        } else if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    });
}
