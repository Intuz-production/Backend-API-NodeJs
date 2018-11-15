exports.func = function(){
    return {
        /* function to check whether required req param is exist in post or not*/
        validateReqParam : function(post, reqparam){
            var remain = [];
            var req = [];            
            for(var i=0;i<reqparam.length;i++){                
                if(typeof post[reqparam[i]]!='undefined'){                                                           
                    if(post[reqparam[i]]==''){
                        req.push(reqparam[i]);
                    }                    
                }else{                    
                    remain.push(reqparam[i]);
                }
            }              
            var respose = {'missing':remain,'blank':req};                  
            return respose;
        },
        /* function to load error message template for blank/missing req params for all APIs*/
        loadErrorTemplate: function(elem){
            var missing = elem.missing;    
            var blank_str = '', missing_str = '';    
            if(missing.length>0){
                missing_str = missing.join(',');        
                missing_str+=' missing';
            }
            var blank = elem.blank;    
            if(blank.length>0){        
                blank_str = blank.join(',');        
                blank_str+=' should not be blank';
            }
            var s = [missing_str, blank_str];
            var str = s.join(' \n ');
            return str;
        },
        /* function to load error message template for blank/missing req params for all APIs*/
        validateNumber : function (phone) {
            if(typeof phone != "undefined" && phone != "")
            {
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
                    national_phone: (national_phone.indexOf(' ') >= 0)?national_phone.replace(/\s/g, "") :national_phone,
                    international_phone: (international_phone.indexOf(' ') >= 0)?international_phone.replace(/\s/g, "") :international_phone,
                    number : (phoneNumber.values_)[2],
                    country_code : (phoneNumber.values_)[1],
                    E164_phone: E164_phone,
                    RFC3966:RFC3966
                }
                return phone_data;
            }
            else{
                return {}
            }
        },
    };
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};