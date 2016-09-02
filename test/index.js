"use strict";

var o = require("ospec"),
    
    rollup = require("rollup");

o.spec("rollup-plugin-bundles", () => {
    o("test", (done, timeout) => {
        timeout(999999);

        rollup.rollup({
            entry   : [ "./test/specimens/a.js", "./test/specimens/b.js" ],
            plugins : [
                require("../src/index.js")({
                    shared : "./shared.js"
                })
            ]
        })
        .then((result) => {
            var out = result.generate();

            console.log(`Output:\n${out.code}`);
            
            return result.shared;
        })
        .then((shared) => {
            console.log("Shared:\n", shared);
        })
        .catch((error) => {
            console.error(error.stack);
        })
        .then(done);
    });
});


o.run();
