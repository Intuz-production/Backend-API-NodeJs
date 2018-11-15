var moment = require('moment');
var msg = require('../config/messages');
var messages = msg.messages;
var nodemailer = require('nodemailer');
var constants = require('../config/constants');

exports.func = function () {
    return {
        /*
         * attachments: [
                {   // utf-8 string as an attachment
                    filename: 'text1.txt',
                    content: 'hello world!'
                },
                {   // binary buffer as an attachment
                    filename: 'text2.txt',
                    content: new Buffer('hello world!','utf-8')
                },
                {   // file on disk as an attachment
                    filename: 'text3.txt',
                    path: '/path/to/file.txt' // stream this file
                },
                {   // filename and content type is derived from path
                    path: '/path/to/file.txt'
                },
                {   // stream as an attachment
                    filename: 'text4.txt',
                    content: fs.createReadStream('file.txt')
                },
                {   // define custom content type for the attachment
                    filename: 'text.bin',
                    content: 'hello world!',
                    contentType: 'text/plain'
                },
                {   // use URL as an attachment
                    filename: 'license.txt',
                    path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
                },
                {   // encoded string as an attachment
                    filename: 'text1.txt',
                    content: 'aGVsbG8gd29ybGQh',
                    encoding: 'base64'
                },
                {   // data uri as an attachment
                    path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
                },
                {
                    // use pregenerated MIME node
                    raw: 'Content-Type: text/plain\r\n' +
                         'Content-Disposition: attachment;\r\n' +
                         '\r\n' +
                         'Hello world!'
                }
            ]
         */
        /* Send Email without attachment */
        send_mail: function (req, data, done) {

            var response = {};
            var transporter = nodemailer.createTransport({
                debug: true,
                host: constants.SMTP.SMTP_HOST,
                secureConnection: false, // true for 465, false for other ports
                port: constants.SMTP.SMTP_PORT,
                tls: {
                    cipher: 'SSLv3'
                },
                auth: {
                    user: constants.SMTP.SMTP_EMAIL,
                    pass: constants.SMTP.SMTP_PASSWORD,
                }
            });

            req.getConnection(function (err, connection) {
                var sql = "SELECT * FROM `setting` WHERE setting_id = 1; ";
                connection.query(sql, function (err, settings) {
                    if (err) {
                        response.status = 0;
                        response.message = messages.ERROR_PROCESSING;
                        return done(response);
                    } else {
                        // var email_message = '<div style="padding:0px; margin:0px; background:#fff;"><table border="0" cellpadding="0" cellspacing="0" style="color:#333; margin:0 auto; width:600px;"><tr><td valign="top" style="padding:0px;"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="text-align:center; background:#393939; padding:30px 0;"><img src="http://'+req.headers.host+'/logo/logo.png" title="" alt="" width="200"/></td></tr><tr><td style="padding:20px 25px 30px 25px;font-family: Arial, Helvetica, sans-serif; font-size:12px;">'+data.html+'</td></tr></table></td></tr><tr><td style="color:#888888; background:#EDEDED; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:12px; padding:10px 0;">&copy; Whooradio Ltd '+moment().format("YYYY")+'</td></tr></table></div>';
                        //  var email_message = '<div style="padding:0px; margin:0px; background:#fff;"><table border="0" cellpadding="0" cellspacing="0" style="color:#333; margin:0 auto; width:600px;"><tr><td valign="top" style="padding:0px;"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="text-align:center; background:#393939; padding:30px 0;"><img src="http://'+req.headers.host+'/logo/logo.png" title="" alt="" width="200"/></td></tr><tr><td style="padding:20px 25px 30px 25px;font-family: Arial, Helvetica, sans-serif; font-size:12px;">'+data.html+'</td></tr></table></td></tr><tr><td style="color:#888888; background:#EDEDED; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:12px; padding:10px 0;">&copy; Whooradio Ltd '+moment().format("YYYY")+'</td></tr></table></div>';
                        var src = "http://" + req.headers.host + "/logo/logo.png";
                        var content = data.html;
                        var email_message = [
                            '<div style="padding:0px; margin:0px; background:#fff;"><table border="0" cellpadding="0" cellspacing="0" style="color:#333; margin:0 auto; width:600px;"><tr><td valign="top" style="padding:0px;"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="text-align:center; background:#393939; padding:30px 0;"><img src="http://',
                            req.headers.host,
                            '/logo/logo.png" title="" alt="" width="200"/></td></tr><tr><td style="padding:20px 25px 30px 25px;font-family: Arial, Helvetica, sans-serif; font-size:12px;">',
                            data.html,
                            '</td></tr></table></td></tr><tr><td style="color:#888888; background:#EDEDED; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:12px; padding:10px 0;">&copy; Artwork ',
                            moment().format("YYYY"),
                            '</td></tr></table></div>'
                        ].join('');
                        var mailOptions = {
                            from: (typeof data.from != 'undefined' && data.from != '') ? data.from : settings[0].setting_email,
                            to: data.to,
                            subject: data.subject,
                            html: email_message,
                            // attachments: (typeof data.attachments != 'undefined' && (data.attachments).length > 0) ? data.attachments : ""
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                                response.status = 0;
                                response.message = error;
                                return done(response);
                            } else {
                                response.status = 1;
                                response.message = 'Mail has been sent to email-id';
                                return done(response);
                            }
                        });
                    }
                });
            });
        },
        /* Send Email with attachment */
        sendMail: function (from, to, subject, html, attachment, cb) {

            var transporter = nodemailer.createTransport({
                debug: true,
                host: constants.SMTP.SMTP_HOST,
                secureConnection: false, // true for 465, false for other ports
                port: constants.SMTP.SMTP_PORT,
                tls: {
                    cipher: 'SSLv3'
                },
                auth: {
                    user: constants.SMTP.SMTP_EMAIL,
                    pass: constants.SMTP.SMTP_PASSWORD,
                }
            });

            let mailOptions = {
                from: from, // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                html: `<p><img style="display: block; margin-left: auto; margin-right: auto;" src="${constants.API_URL}/setting_favicon_image/logo-mini.png" alt="Intuz" width="112" height="112" /></p>
                    <p>&nbsp;</p>
                    ${html}
                    <p>Thank you,</p>
                    <p>Intuz</p>`, // html body
                attachments: attachment != "" ? [{ path: attachment }] : [] //attachments
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return cb(error);
                }
                else {
                    // console.log('Message sent:', info.messageId);
                    // console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
                    cb();
                }
            });
        }
    }
}