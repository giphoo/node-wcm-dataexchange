var log4js = global.log4js || require("log4js");
var logger = log4js.getLogger("DataExchange");

var $;
try{
    var stime = new Date().getTime();

    var window = require("jsdom").jsdom().parentWindow;
    var jquery = require("jquery");
    global.DOMParser = require("xmldom").DOMParser;

    $ = jquery(window);

    $.json2xml = require("./json2xml");

    logger.debug("jquery addon loaded![%s ms]", new Date().getTime() - stime);
}catch(e){
    logger.error("Error when init jquery addon." + e.stack);
}//output $ as jquery

module.exports = $;