"use strict";

var pick = require("lodash.pickby");

module.exports = function() {

    return {
        name : "rollup-plugin-bundles",

        // TODO: would need a new hook, "onbeforegenerate" or something
        ongenerate : function(opts, result) {
            var deps = {};

            console.log(opts.bundle.modules);
            
            // Walk bundles dependencies and build up mapping
            opts.bundle.modules.forEach((module) => {
                Object.keys(module.resolvedIds).forEach((id) => {
                    var dep = module.resolvedIds[id];

                    if(!deps[dep]) {
                        deps[dep] = [];
                    }

                    deps[dep].push(module.id);
                });
            });

            // Filter out any non-shared deps
            deps = pick(deps, (modules) => modules.length > 1);

            // Go get module references
            deps = Object.keys(deps).map((id) =>
                opts.bundle.modules.find((module) =>
                    module.id === id
                )
            );

            // Remove shared modules from already-generated bundle output
            // TODO: doesn't work because bundle modules only have pre-generated code,
            // not the actual output created by Bundle.render
            deps.forEach((dep) => {
                result.code = result.code.replace(dep.code, "");
            });
        }
    };
};
