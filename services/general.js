var fs = require('fs');
exports.func = function () {
    return {
        
        /*
         * get image path for api
         */
        image_not_found_api : function (dir, img, host) {

            img_path = "";
            if (img != '') {
                check_img_path = fs.realpathSync('.') + "/uploads/" + dir + "/" + img;
                var exists = fs.existsSync(check_img_path);
                if (exists) {
                    img_path = "http://" + host + "/" + dir + "/" + img;
                }
            }
            return img_path;
        },
        /*
         * get image path for backend
         */
        image_not_found : function (dir, img) {

            img_path = "/images/no_image/no_image.jpg";
            if (img != '') {
                check_img_path = fs.realpathSync('.') + "/uploads/" + dir + "/" + img;
                var exists = fs.existsSync(check_img_path);
                if (exists) {
                    img_path = "/" + dir + "/" + img;
                }
            }
            return img_path;
        }
}
}
