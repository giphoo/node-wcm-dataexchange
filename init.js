var npm = require("npm");

npm.load({}, function(){

    if(process.platform.match(/^win/)){
        if(process.arch.match(/32$/)){
            npm.install("jsom_win32");
        }else if(process.arch.match(/64$/)){
            npm.install("jsom_win64");
        }
    }else{
        npm.install("jsom");
    }
});