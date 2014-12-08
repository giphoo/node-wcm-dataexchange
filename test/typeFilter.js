var WCM = require("../");

var wcm = new WCM();
wcm.connect();

var out = wcm.dataexchange.getPostData("wcm6_website", "findbyid",{
    OBJECTID : "0",
    TABLENAME : "a",
    ANOTHERNAME : "b"
});

console.log(out);