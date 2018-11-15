var apn = require("apn");
var FCM = require('fcm-push');
var moment = require('moment');
var constants = require('../config/constants');

var options = {
    token: {
        key: "key.p8", //path/to/APNsAuthKey_XXXXXXXXXX.p8
        keyId: "123123", //key-id
        teamId: "123123" //developer-team-id
    },
    /*proxy: {
        host: "192.168.10.80",
        port: 8080
    }*/
    production: true,
};

var apn_provider = new apn.Provider(options);
var notification = new apn.Notification(options);

exports.notification = function(){
    return{
        /*function to send notification*/
        sendNotification: function(device_token, msg, body, req){
            notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            notification.badge = 3;
            notification.sound = "default";
            notification.alert = msg;
            notification.payload = {'body': body};
            notification.topic = "com.artwork";
            
            apn_provider.send(notification, device_token).then( (result) => {
                return;
            // see documentation for an explanation of result
            }).catch(function(err){
                return;
            }); 
        },
        /* function to send notification from admin side */
        sendNotifications: function (android_device_token, ios_device_token, android_message, ios_message, req) {
            var fcm = new FCM(constants.SERVER_KEY);

            if (android_device_token.length > 0) {
                fcm.send(android_message, function (err, resp) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(resp)
                    }
                });
            }
            if (ios_device_token.length > 0) {

                fcm.send(ios_message, function (err, resp) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(resp)
                    }
                });
            }
        },
        /* function to store notification in our database
         * @data must be containing : user_id, type(integer), message 
         */
        saveNotification: function(data, msg, req){
            req.getConnection(function(err, connection) {
                var data = {};
                var mdate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                var qr = 'INSERT INTO `notifications` SET ?';
                var qr_data = {
                    user_id:data.user_id,
                    type:data.type,
                    message:msg,
                    is_read:0,
                    status:1,
                    created_date:mdate
                };
                connection.query(qr, qr_data, function(err, result){
                    if(err){
                        throw err;
                        return;
                    }else{
                        return;
                    }
                })
            });
        }
    };
}