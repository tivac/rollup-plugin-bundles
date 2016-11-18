"use strict";

var o = require("ospec"),
    
    rollup = require("rollup");

o.spec("rollup-plugin-bundles", () => {
    o("test", (done, timeout) => {
        timeout(Infinity);

        rollup.rollup({
            entry : [
                "./test/specimens/a.js",
                "./test/specimens/b.js"
            ],
            plugins : [
                require("../src/index.js")({
                    shared : "./shared.js"
                })
            ]
        })
        .then((result) => {
            var out = result.generate();

            console.log(out);

            out.bundles.then((bundles) => {
                bundles.forEach((bundle) => {
                    var thing = bundle.generate();
                    
                    console.log(thing.code);
                });
            });
        })
        .then(done)
        .catch((error) => {
            console.error(error.stack);

            return done(error);
        });
    });
});


o.run();
