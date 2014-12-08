var util = require("util");
var $ = require("../lib/jQuery/");

var input = '<?xml version="1.0"?><a t="2"><![CDATA[tsss]]></a>';

var t = $.parseXML(util.format("<wcm_result>%s</wcm_result>", input));
console.log($(t).find("a").attr("t"));
console.log($(t).text());
console.log($(t).find("a").prop("tagName"));
console.log($(t).html());