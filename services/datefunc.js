var moment = require('moment');

/* Function to get formatted date */
exports.func = function () {
    return {
        /*
         * current date time to enter in db (eg. created_date)
         * local time
         */
        dbDate: function (date) {
            // local time
               return moment().format('YYYY-MM-DD HH:mm:ss');
            // utc time
            // return moment().utc().format('YYYY-MM-DD HH:mm:ss');
        },
        
}
}
