/* Check that user having access to view/add/update/delete or not */
exports.userAccess = function (req, res, next) {
    if(!req.session.user){
        return next();
    }

    var user_role_id = req.session.user.role_id;
    if(user_role_id == '1'){ //superadmin (All rights)
        req.users_access = "yes"; // for ajax use (active, delete)
         return next();
    }

    req.getConnection(function(err, connection) {
    if(err) throw err;
        var action_path = req.originalUrl.split("?").shift(); // Url With out query string (Removed query string)
        var url_segment = action_path.split( '/' );
        var action = url_segment[3];

        var contoller_path = '/'+ url_segment[1]+'/'+url_segment[2];

        var sql = "SELECT * FROM permission join menu_list on permission.menu_id = menu_list.id WHERE menu_list.status = '1' AND action_path = '" + contoller_path + "' AND roles_id = " + user_role_id;
        connection.query(sql, function(err, rows) {
            if (err) { 
                res.redirect('/');
            } else {
                if(rows.length == 1){
                    
                    if(action == 'index' && rows[0].is_view == 1) {
                        return next();
                    }else if (action == 'create' && rows[0].is_add == '1') {
                        return next();
                    }else if (action == 'update' && rows[0].is_update == '1') {
                        return next();
                    }else if (action == 'activedeactive' && rows[0].is_publish == '1'){
                        req.users_access = "yes";
                        return next();
                    }else if (action == 'delete' && rows[0].is_delete == '1'){
                        req.users_access = "yes";
                        return next();
                    }else if (action == 'activedeactive' && rows[0].is_publish == '0'){
                        req.users_access = "no";
                    }else if (action == 'delete' && rows[0].is_delete == '0'){
                        req.users_access = "no";
                    }else if (action != 'index' && action != 'create'  && action != 'update'  && action != 'activedeactive' && action != 'delete' ){
                        return next();
                    }

                    
                    res.render('admin/error_pages/permission_denied', {
                        session: req.session,
                    });
                    //res.redirect('/'); // user have no access
                }else{
                    var sql = "SELECT * FROM menu_list WHERE menu_list.status = '1' AND action_path = '" + contoller_path + "'" ;
                    
                    connection.query(sql, function(err, rows) {
                        if (err) { 
                            res.redirect('/');
                        } else {
                            if(rows.length > 0){
                                res.render('admin/error_pages/permission_denied', {
                                    session: req.session,
                                });
                            }else{
                                return next();
                            }
                        }
                    });
                }
            }
        });
    });
}
        
  