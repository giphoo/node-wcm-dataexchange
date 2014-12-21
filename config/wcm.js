module.exports = {
    url : "http://127.0.0.1:8080/wcm/",
    login : {
        user : {
            UserName: "admin",
            PassWord: "trsadmin"
        },
        path : "./app/login.jsp",
        time : 3000//重连的间隔时间
    },
    login_dowith : {
        path : "./app/login_dowith.jsp"
    },
    check : {
        path : "./app/main/refresh.jsp",//检查登陆的地址
        time : 300000//检查间隔时间
    },
    dataexchange : {
        type : "nologin",//login or nologin
        service : {
            login : "./center.do",
            nologin : "./govcenter.do"
        },
        fileupload : {
            login : "./fileuploader.do",
            nologin : "./govfileuploader.do"
        },
        contentType : "text/xml",
        encoding : "UTF-8"
    }
};