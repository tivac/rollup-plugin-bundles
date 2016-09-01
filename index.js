"use strict";

var Bundle = require("rollup").Bundle,
    
    pick = require("lodash.pickby"),
    
    entry = '\0rollup-plugin-bundles:bundle-entry';

module.exports = function() {
    var deps = {},
        shared;
    
    return {
        name : "rollup-plugin-bundles",

        // Ensure special shared bundle entry doesn't get resolved by other plugins
        resolveId : function(id) {
            if(!id !== entry) {
                return undefined;
            }

            return entry;
        },

        // Replace shared bundle entry w/ all it's constituent modules
        load : function(id) {
            if(id !== entry) {
                return undefined;
            }

            return Promise.resolve(deps.map((mod) => mod.code).join("\n"));
        },

        // TODO: This hook doesn't actually exist, I've hacked up the local
        // copy of rollup to:
        // 1) Call `onbeforegenerate` hooks before generating any code
        // 2) Made the `bundle` property be a live reference to the bundle object
        // 3) Put the previous `bundle` property onto `result` instead
        onbeforegenerate : function(opts) {
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
            deps = deps.map((idx) => opts.bundle.orderedModules.splice(idx, 1)[0]);

            // Create new shared bundle from the share dependencies
            shared = new Bundle({
                entry : entry,
                cache : {
                    modules : deps
                }
            });
        },

        ongenerate : function(opts) {
            opts.result._shared = shared;
            opts.result.shared = shared.build();
        },

        onwrite : function(opts) {
            // TODO: write output... somewhere
        }
    };
};
