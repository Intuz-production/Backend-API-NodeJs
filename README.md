# Backend-API-NodeJs
We have created a very simple and ready to use admin panel using node.js and MySQL. It covers all the basic modules in backend and few sample APIs i.e. login/signup, forgot password, media uploads etc.
<br>

# Installation

*System Requirement:*
- Nodejs v8+ 
- MySql v5.5+

*Node Package Installation:*

Clone the repository in to your system using git tool. then run below commands in terminal

```
$ CD /<project directory>
$ npm install –save
``` 

*Setup Database:*

Import databse dump from db/nodebackend.sql

*Configuration Changes:*
- Database: set you database connection in config/db.js
- Constants (Not mandatory): set your project global credentials values in config/constants.js

*Run: node app.js*
<br>

# Backend Features

- User Manangement
- CMS
- Role Management (for the backend users)
- Broadcasts (send bulk notifications to app users)
- Email Templates
- Setttings
<br>

# APIs
- Upload Video: /api/user/videoupload
- Upload Media: /api/user/mediaupload
- Pre Signup: /api/user/pre-signup
- Social Login: /api/user/social-login
- Login: /api/user/login
- Signup: /api/user/signup
- Change Password:	/api/user/changepassword
- Forgot Password: /api/user/forgotpassword
- Phone/Email unique validation:	/api/user/check-phone
- Save device token and device type:	/api/user/save-token
- Edit profile:	/api/user/editprofile
- Get Profile: /api/user/get-profile-info
- Get notification list:	/api/user/getnotificationlist
- Delete notification:	/api/user/delete-notification
- Get master data:	/api/master/get-master-data
- Get CMS:	/api/master/get-cms