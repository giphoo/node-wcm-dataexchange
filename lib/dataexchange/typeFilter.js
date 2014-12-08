var datefomat = require("dateformat");

module.exports = typeFilter;
module.exports.getType = getType;

function typeFilter(o){
    switch (getType(o)){
        case "null" :
        case "object" :
        case "function" :
            return false;
        case "date" :
            return datefomat(o,"yyyy-mm-dd HH:MM:ss");
        case "array" :
            return o.join(",");
        default :
            return o.toString();
    }
}

function getType(o) {
    if (o === undefined || o === null) return "null";
    var _t; return ((_t = typeof(o)) == "object" ? o==null && "null" || Object.prototype.toString.call(o).slice(8,-1):_t).toLowerCase();
}