"use strict";

var o = require("./ospec"),
    
    rollup = require("rollup");

o.spec("bundler", () => {
    o("test", (done, timeout) => {
        timeout(1000);

        rollup.rollup({
            entry   : [ "./test/specimens/a.js", "./test/specimens/b.js" ],
            plugins : [
                require("rollup-plugin-multi-entry")(),
                require("../")()
            ]
        })
        .then((bundle) => {
            console.log(`Output:\n${bundle.generate().code}`);

            done();
        })
        .catch((error) => {
            console.error(error.stack);

            done();
        });
    });
});


o.run();
