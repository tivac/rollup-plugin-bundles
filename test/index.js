"use strict";

var o = require("ospec"),
    
    rollup = require("rollup");

o.spec("bundler", () => {
    o("test", (done, timeout) => {
        timeout(1000);

        rollup.rollup({
            entry   : [ "./test/specimens/a.js", "./test/specimens/b.js" ],
            plugins : [
                require("rollup-plugin-multi-entry")(),
                require("../")({
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
            console.log(`Shared:\n${shared.code}`);
        })
        .catch((error) => {
            console.error(error.stack);
        })
        .then(done);
    });
});


o.run();
