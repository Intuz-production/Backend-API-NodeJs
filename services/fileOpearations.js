// Copyright (C) 2018 INTUZ. 

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
// ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
// THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
var fs = require('fs');
var multer = require('multer');
var thumb = require('node-thumbnail').thumb;
var path = require('path');

exports.filesop = function () {
    return {
        /*
         * Use: Upload file on server
         * Return: storage (Object)
         */
        file_storage: function () {
            var storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    check_file_path = fs.realpathSync('.') + "/uploads/" + file.fieldname;
                    var exists = fs.existsSync(check_file_path);

                    if (!exists) {
                        fs.mkdirSync(path.join(fs.realpathSync('.') + "/uploads/", file.fieldname), 0777)
                    }
                    cb(null, 'uploads/' + file.fieldname)
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

            return storage;
        },

        /*
         * Use: Generate thumbnail image and store in folder
         * Args: source_image, destination_path, call (Function callback())
         * Return: err(String of error message, if any)
         */
        thumbnailc: function (source_image, destination_path, call) {
            thumb({
                source: source_image, // could be a filename: dest/path/image.jpg
                destination: destination_path,
                concurrency: 1,
                width: 150, // minimum value, not static
                height: 150,
            }, function (files, err, stdout, stderr) {
                if (err) {
                    throw err;
                }
                return call();
            });
        },

        /*
         * Use: Get image path for API
         * Args: dir, filename, host         
         * Return: file_path (String)         
         */
        file_not_found_api: function (dir, filename, host) {
            file_path = "";
            if (filename != '') {
                check_file_path = fs.realpathSync('.') + "/uploads/" + dir + "/" + filename;
                var exists = fs.existsSync(check_file_path);
                if (exists) {
                    file_path = "http://" + host + "/" + dir + "/" + filename;
                }
            }
            return file_path;
        },

        /*
         * Use: Delete file from server
         * Args: files (Array of files object to delete)        
         * Return: err (String of error message, if any)
         */
        delete_files: function (files) {
            files.forEach(function (file) {
                file_path = fs.realpathSync('.') + "/uploads/" + file.dir + "/" + file.name;
                var exists = fs.existsSync(file_path);
                if (exists) {
                    fs.unlink(file_path, function (err) {
                        if (err) throw err;
                    });
                }
            });
        },
    }
}
