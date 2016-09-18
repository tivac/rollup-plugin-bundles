"use strict";

var o = require("ospec"),
    
    rollup = require("rollup");

o.spec("bundler", () => {
    o("test", (done, timeout) => {
        timeout(999999);

        rollup.rollup({
            entry   : [ "./test/specimens/a.js", "./test/specimens/b.js" ],
            plugins : [
                require("../")({
                    shared : "./shared.js"
                })
            ]
        })
        .then((result) => {
            var out = result.generate();

            console.log(`Output:\n\n${out.code}\n`);
            
            return result.shared;

        })
        .then((shared) => {
            console.log(`Shared:\n\n${shared.code}\n`);
        })
        .catch((error) => {
            console.error(error.stack);
        })
        .then(done);
    });
});


o.run();
