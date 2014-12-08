var jconfig = require("jconfig");
var log4js = require("log4js");
var logger = log4js.getLogger("app");

var conf = jconfig("./configNoLogin/", {
    module : module
});

var WCM = require("../");

var wcm = new WCM(conf);
wcm.connect();

wcm.dataexchange.serviceCaller({
    name: "wcm61_website",
    method: "findbyid",
    par: {
        objectid: 100
    }
}, function($d, error){
    if (error){
        logger.error("ERROR!!", error);
    }else{
        logger.info("Sitedesc=", $d.find("SITEDESC").text());
    }
});