var http = require("http");
var url = require("url");
var util = require("util");
var dataexchange = require("./lib/dataexchange/");

var jconfig = require("jconfig");
var _jconfig = jconfig("./config", {
    module : module
});

var log4js = global.log4js || require("log4js");
if (!global.log4js){
    log4js.configure(jconfig.extend(true, {}, _jconfig.log4js));
}
var logger = log4js.getLogger("WCM");

function WCM(_opt){
    this._init(_opt);
}

var ERROR = {
    NO_CONNECT : "WCM DOWN!",
    NO_COOKIE : "WCM DONOT support cookie login!",
    NO_SESSION : "WCM DONOT give a match session!",
    WRONG_PASSWORD : "Your password maybe WRONG!"
};

WCM.ERROR = ERROR;
WCM.prototype._config = {};
WCM.prototype.dataexchange = null;
WCM.prototype._init = function(_config){
    var config = {};
    jconfig.extend(true, config, _jconfig);//clone default
    jconfig.extend(true, config, _config);//get customer config

    this._config = config;

    var _wcm = this._config.wcm;
    _wcm.URL = url.parse(_wcm.url);

    logger.debug("new WCM(%s)", util.inspect(this._config, {
        depth : 5
    }));
};
WCM.prototype.connect = function(_func){
    var _wcm = this._config.wcm;
    var _dx = _wcm.dataexchange;
    var reconnectTime = _wcm.login.time;

    var _this = this;
    if (_dx.type == "login"){
        this.login(function(isLogin, err){
            if (isLogin){
                _this.dataexchange = dataexchange({
                    url : _wcm.url,
                    session : _wcm.session,
                    service : _dx.service[_dx.type],
                    fileupload : _dx.fileupload[_dx.type],
                    encoding : _dx.encoding,
                    contentType : _dx.contentType
                });

                _func && _func(_this);
                _this.keepCheck(isLogin);
            }else{
                logger.error("WCM login fail!" + err);
                logger.error("It will reconnect in %s s...", reconnectTime / 1000);
                setTimeout(function(){
                    logger.info("Start reconnect...", reconnectTime / 1000);
                    _this.connect(_func);
                }, reconnectTime);
            }
        });
    }else{
        this.dataexchange = dataexchange({
            url : _wcm.url,
            service : _dx.service[_dx.type],
            encoding : _dx.encoding,
            contentType : _dx.contentType
        });
        _func && _func(this);
    }
};
WCM.prototype.login = function(_func){
    var _wcm = this._config.wcm;
    var _URL = _wcm.URL;
    var _expSession = _wcm.login.expSession;

    var _this = this;

    logger.debug("Get session start![hostname=%s,port=%s,moethod=%s]");
    var parSession = {
        hostname : _URL.hostname,
        port : _URL.port,
        method : "GET",
        path : url.resolve(_URL.path, _wcm.login.path)
    };
    logger.debug("Get session start![%s]", JSON.stringify(parSession));
    var reqSession = http.request(parSession);

    reqSession.on("response", function(res){
        logger.debug("Get session statusCode[%s]: %s", JSON.stringify(parSession), res.statusCode);
        if (res.statusCode >= 400){
            logger.error("Get session error[%s]: %s", JSON.stringify(parSession), ERROR.NO_CONNECT);
            return _func(false, ERROR.NO_CONNECT);
        }

        var cookie = res.headers["set-cookie"];

        if (cookie) {
            cookie = cookie.join("||").match(_expSession);
            if (cookie != null) {
                _wcm.session = cookie[0];

                logger.info("Get session[%s]: %s", JSON.stringify(parSession), _wcm.session);
            }else{
                logger.error("Get session error[%s]: %s", JSON.stringify(parSession), ERROR.NO_COOKIE);
                return _func(false, ERROR.NO_COOKIE);
            }
        }else{
            logger.error("Get session error[%s]: %s", JSON.stringify(parSession), ERROR.NO_SESSION);
            return _func(false, ERROR.NO_SESSION);
        }

        _this.login_dowith(_func);
    });

    reqSession.end();
};
WCM.prototype.login_dowith = function(_func){
    var _wcm = this._config.wcm;
    var _URL = _wcm.URL;

    var _this = this;

    var par = url.format({
        pathname : _wcm.login_dowith.path,
        query: _wcm.login.user
    });

    var parLogin = {
        hostname : _URL.hostname,
        method : "GET",
        port : _URL.port,
        path : url.resolve(_URL.path, par),
        headers : {
            Cookie : _wcm.session
        }
    };
    logger.debug("Login_dowith start: %s", JSON.stringify(parLogin));
    var reqLogin = http.request(parLogin);

    reqLogin.on("response", function(res){
        logger.debug("Login_dowith start[%s]: %s", JSON.stringify(parLogin), res.statusCode);

        if(res.statusCode >= 400){
            logger.error("Login_dowith result error[%s][%s]: %s", res.statusCode, JSON.stringify(parLogin), ERROR.NO_CONNECT);
            return _func(false, ERROR.NO_CONNECT);
        }

        var headersSetCookie = res.headers["set-cookie"];
        var cookie;
        if (headersSetCookie){
            cookie = headersSetCookie.join("||").match(_wcm.login_dowith.expSession);

            if (cookie){
                logger.debug("Catch another session of WCM[Set-Cookie=%s], it will be Change to it...", cookie[0]);
                _wcm.session = cookie[0];
            }
        }

        _this.check(function(isLogin){
            if (isLogin){
                logger.debug("Login finish[%s]", JSON.stringify(parLogin));
                _func && _func(true);
            }else{
                logger.error("Login_dowith result error[%s]: %s", JSON.stringify(parLogin), ERROR.WRONG_PASSWORD);
                _func && _func(false, ERROR.WRONG_PASSWORD);
            }
        });

    });

    reqLogin.end();
};
WCM.prototype.keepCheck = function(isLogin){
    var _wcm = this._config.wcm;
    var _check = _wcm.check;
    var _this = this;

    if (isLogin){
        setTimeout(function(){
            _this.check(_this.keepCheck);
        }, _check.time);
    }else{
        logger.warn("WCM-connection is offline, WCM will reconnect...");
        this.connect();
    }
};
WCM.prototype.check = function(_func){
    var _wcm = this._config.wcm;
    var _check = _wcm.check;
    var _URL = _wcm.URL;

    var _this = this;

    var parCheck = {
        hostname : _URL.hostname,
        port : _URL.port,
        method : "GET",
        path : url.resolve(_URL.path, _check.path),
        headers : {
            Cookie : _wcm.session
        }
    };
    logger.debug("Check connection of WCM: %s", JSON.stringify(parCheck));
    var reqCheck =  http.request(parCheck);
    reqCheck.on("response", function(res){
        if (res.statusCode == 200){//alive
            logger.debug("Check session of WCM[%s]: online", JSON.stringify(parCheck));
            _func && _func.call(_this, true);
        }else{//down
            logger.warn("Check session of WCM[%s][code=%s]: offline", JSON.stringify(parCheck), res.statusCode);
            _func && _func.call(_this, false);
        }
    });

    reqCheck.end();
};

module.exports = WCM;
module.exports.dataexchange = dataexchange;