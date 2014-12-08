var jconfig = require("jconfig");

var conf = jconfig("./config/", {
    module : module
});

var WCM = require("../");

var wcm = new WCM(conf);
wcm.connect(function(){
    wcm.dataexchange.serviceCaller({
        name: "wcm61_website",
        method: "findbyid",
        par: {
            objectid: 22
        }
    }, function($d, error){
        if (error){
            console.log("ERROR!!");
        }else{
            console.log($d.orginText);
        }
    });
});