var $ =  require("../lib/jQuery/");

var t = $.json2xml({a:
    {
        "@" : "cc",
        "#cdata": "sss"
    }
});

console.log(t);