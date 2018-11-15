var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('admin/login');
});
router.get('/admin', function (req, res) {
    if(req.isAuthenticated()){
        res.redirect('/admin/dashboard');    
    }
    res.render('admin/login');
});
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/admin/dashboard');
}

module.exports = router;