var util = require("util");
var http = require("http");
var url = require("url");
var FormData = require("form-data");
var jconfig = require("jconfig");
var log4js = global.log4js || require("log4js");
var logger = log4js.getLogger("DataExchange");

var exports = module.exports;
module.exports = dataexchange;
module.exports.DataExchange = DataExchange;
var $ = module.exports.jQuery = require("../jQuery/");//output $ as jquery

function dataexchange(_opt){
    return new DataExchange(_opt);
}

function DataExchange(_opt){
    var opt = {};
    jconfig.extend(true, opt, this.opt);//clone default options
    jconfig.extend(true, opt, _opt);//get customer options

    this.opt = opt;//set options
}

DataExchange.prototype.opt = require("./defaultOpt");//default options
DataExchange.prototype.typeFilter = module.exports.typeFilter = require("./typeFilter");
DataExchange.prototype.getPostData = function(sName, sMethod, sPar) {
    if (sName && sMethod){
        var pd = {
            "post-data": {
                method : {
                    "@type" : sMethod,
                    "#text" : sName
                },
                parameters : {
                }
            }
        }

        if (sPar){
            for (var key in sPar){
                par = this.typeFilter(sPar[key]);

                if (par !== false) {
                    pd["post-data"]["parameters"][key] = {
                        "#cdata" : par
                    }
                }
            }
        }
        return $.json2xml(pd);
    }else{
        logger.error("ERROR input for PostData");
        return false;
    }


    var $pd = $("<post-data/>");
    var $method = $("<method/>");
    var $parameters = $("<parameters/>");

    $pd.append($method);
    $pd.append($parameters);

    $method.attr({
        type : sMethod
    }).html(sName);

    var par = "";
    var $par = "";
    if (sPar){
        for (var key in sPar){
            par = typeFilter(sPar[key]);

            if (par != false) {
                $par = $("<" + key + "/>");
                $par.text(par);

                $parameters.append($par);
            }
        }
    }
    //logger.debug($pd.prop("outerHTML"));

    return $pd.prop("outerHTML");
};
DataExchange.prototype.serviceCaller = function(_opt, fun) {
    var opt = {
            name : "",
                method : "",
                par : {}
        };
        util._extend(opt, _opt);

        var OPT = this.opt;

        var _this = this;
        var urlReqService = url.resolve(OPT.url, OPT.service);
        var optReqService = url.parse(urlReqService);
        var pdReqService = this.getPostData(opt.name, opt.method, opt.par);

        logger.debug("Start service caller:[url=%s,name=%s,method=%s,parameter=%s]", urlReqService, opt.name, opt.method, JSON.stringify(opt.par));
        logger.debug("Request:%s", util.inspect(pdReqService, {depth : 3}));
        util._extend(optReqService, {
            method : "POST",
            headers : {
                "X-Requested-With": "XMLHttpRequest",
                "content-type": OPT.contentType,
                cookie :OPT.session,
                "Content-Length": this.getContentLength(pdReqService)
            }
        });

        var reqService = http.request(optReqService);
        reqService.on("response", function(res){
            logger.debug("Service callback code[url=%s,name=%s,method=%s,parameter=%s]: %s", urlReqService, opt.name, opt.method, JSON.stringify(opt.par), res.statusCode);

            var wcm_result = ("<wcm_result>%s</wcm_result>");
            if (res.statusCode >= 300){
                logger.error("Service callback code[url=%s,name=%s,method=%s,parameter=%s]: %s", urlReqService, opt.name, opt.method, JSON.stringify(opt.par), res.statusCode);
                fun && fun($.parseXML(util.format(wcm_result, "")), {
                    code : res.statusCode,
                    message : "Bad response:[" + res.statusCode + "]" + res.statusText
                }, res.statusCode, res);
            }else{
                res.setEncoding(OPT.encoding);

                var strResponse = "";
                res.on("data", function(data){
                    strResponse += data;
                });

            res.on("end", function(data){
                strResponse += data ? data : "";
                logger.debug("Get service callback: %s", strResponse);
                var $wcm_result = $($.parseXML(util.format(wcm_result, strResponse)));
                $wcm_result.orginText = strResponse;

                var error = _this.isError($wcm_result);
                if(error){
                    logger.error("Error :", error);
                    logger.error(pdReqService);
                    fun && fun($wcm_result, error, res.statusCode, res);
                }else{
                    fun && fun($wcm_result, false, res.statusCode, res);
                }


            });
        }
    });

    reqService.end(pdReqService, OPT.encoding);
};
DataExchange.prototype.fileupload = function(fileStream, options, fun){

    var OPT = this.opt;
    var _this = this;

    var defaultOptions = {
        FileExt : "",
        FileFlag : "U0"
    }

    util._extend(defaultOptions, options);

    var urlReqService = url.resolve(OPT.url, OPT.fileupload);
    var optReqService = url.parse(urlReqService);

    util._extend(optReqService, {
        method : "POST",
        headers : {
            "Content-Type": "multipart/form-data",
            cookie : OPT.session,
            FileExt: defaultOptions.FileExt,
            FileFlag: defaultOptions.FileFlag
        }
    });

    var request = http.request(optReqService);


    request.on('response', function(res) {
        res.setEncoding(OPT.encoding);

        var strResponse = "";
        res.on("data", function(data){
            strResponse += data;
        });

        res.on("end", function(data){
            strResponse += data ? data : "";
            logger.debug("Get service callback: %s", strResponse);
            var $wcm_result = $($.parseXML(strResponse));
            $wcm_result.orginText = strResponse;

            var error = _this.isError($wcm_result);
            if(error){
                logger.error("Error :", error);
                logger.error(optReqService);
                fun && fun($wcm_result, error, res.statusCode, res);
            }else{
                fun && fun($wcm_result.find("ShowName").text(), false, res.statusCode, res);
            }
        });
    });

    fileStream.pipe(request);
}
DataExchange.prototype.getContentLength = function(content){
    var len = 0;
    for (var i = 0; i < content.length; i++){
        var n = encodeURIComponent(content[i]).length;
        if (n > 3){
            len += parseInt(n / 3);
        }else{
            len ++;
        }
    }

    return len;
}
DataExchange.prototype.isError = function($data) {
    if ($data.length <= 0)
        return {
            code : -2,
            message : "NODATA"
        };
    var $fault = $data.find("fault");
    if ($fault.length)
        return {
            code : $fault.find("code").text(),
            message : $fault.find("message").text()
        };
    else
        return false;
};
DataExchange.prototype.isNull = function(s) {
    return s == undefined || s == null || ( typeof (s) == "string" && s.match(/^\s*$/) != null);
};

DataExchange.prototype.post = function(_url, par, fun){
    var form = "";
    if (typeof par == "string")
        form = par;
    else form = url.format({query:par}).slice(1);

    var OPT = this.opt;

    var _this = this;
    var urlReqService = url.resolve(OPT.url, _url);
    var optReqService = url.parse(urlReqService);

    util._extend(optReqService, {
        method : "POST",
        headers : {
            //"X-Requested-With": "XMLHttpRequest",
            "content-type":  "application/x-www-form-urlencoded",
            cookie :OPT.session,
            "Content-Length": this.getContentLength(form)
        }
    });

    var reqService = http.request(optReqService);
    reqService.on("response", function(res){

        var wcm_result = ("<wcm_result>%s</wcm_result>");
        if (res.statusCode >= 300){
            logger.error("Service callback code[url=%s,parameter=%s]: %s", urlReqService, JSON.stringify(par), res.statusCode);
            fun && fun($.parseXML(util.format(wcm_result, "")), {
                code : res.statusCode,
                message : "Bad response:[" + res.statusCode + "]" + res.statusText
            }, res.statusCode, res);
        }else{
            res.setEncoding(OPT.encoding);

            var strResponse = "";
            res.on("data", function(data){
                strResponse += data;
            });

            res.on("end", function(data){
                strResponse += data ? data : "";
                logger.debug("Get service callback: %s", strResponse);
                var $wcm_result = $(strResponse);
                $wcm_result.orginText = strResponse;

                var error = _this.isError($wcm_result);
                if(error){
                    logger.error("Error :", error);
                    logger.error(pdReqService);
                    fun && fun($wcm_result, error, res.statusCode, res);
                }else{
                    fun && fun($wcm_result, false, res.statusCode, res);
                }
            });
        }
    });

    reqService.end(form, OPT.encoding);
};