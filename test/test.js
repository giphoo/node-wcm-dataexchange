var jsdom = require("jsdom");
var $;

jsdom.env("<a></a>",function(errors, window){
    $ = require("jquery")(window);
    console.log($("a").html());
});
