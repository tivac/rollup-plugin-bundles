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
                require("../")()
            ]
        })
        .then((result) => {
            var out = result.generate();

            console.log(`Output:\n${out.code}`);

            console.log(result);

            result.shared.then(() => {
                console.log(result.shared);
            });

            done();
        })
        .catch((error) => {
            console.error(error.stack);

            done();
        });
    });
});


o.run();
