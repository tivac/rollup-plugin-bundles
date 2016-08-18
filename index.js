"use strict";

var pick = require("lodash.pickby");

module.exports = function() {
    return {
        name : "rollup-plugin-bundles",

        // TODO: This hook doesn't actually exist, I've hacked up the local
        // copy of rollup to:
        // 1) Call `onbeforegenerate` hooks before generating any code
        // 2) Made the `bundle` property be a live reference to the bundle object
        // 3) Put the previous `bundle` property onto `result` instead
        onbeforegenerate : function(opts) {
            var deps = {};

            // Walk bundles dependencies and build up mapping
            opts.bundle.orderedModules.forEach((mod) => {
                Object.keys(mod.resolvedIds).forEach((id) => {
                    var dep = mod.resolvedIds[id];

                    if(!deps[dep]) {
                        deps[dep] = [];
                    }

                    deps[dep].push(mod.id);
                });
            });

            // Filter out any non-shared deps
            deps = pick(deps, (modules) => modules.length > 1);

            // Go get module references
            deps = Object.keys(deps).map((id) =>
                opts.bundle.orderedModules.findIndex((module) =>
                    module.id === id
                )
            );

            // Remove shared modules from the array
            deps = deps.map((idx) => opts.bundle.orderedModules.splice(idx, 1));

            // TODO: Figure out how to create a new Bundle using these modules instances
            // and generate some output from it
            console.log(deps);
        }
    };
};
