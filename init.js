var npm = require("npm");

npm.load({}, function(){
    var arch = process.arch;

    if(arch.match(/32$/)){
        npm.install("jsom_win32");
    }else if(arch.match(/64$/)){
        npm.install("jsom_win64");
    }else{
        npm.install("jsom");
    }
})