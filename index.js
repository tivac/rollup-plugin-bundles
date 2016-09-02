/* eslint no-console: "off" */
"use strict";

var Bundle = require("rollup").Bundle,
    
    pick   = require("lodash.pickby"),
    assign = require("lodash.assign"),
    
    name  = "rollup-plugin-bundles",
    entry = `\u0000${name}:entry`;

function replacer(deps) {
    return {
        name : `${name}-replacer`,

        // Ensure special shared bundle entry doesn't get resolved by other plugins
        // TODO: Never matches, maybe rollup-plugin-multi-entry issue?
        resolveId : function(id) {
            console.log(`Resolving ${id} - "${id}" == "${entry}" ? ${id == entry}`);
            
            if(id != entry) {
                return undefined;
            }

            return entry;
        },

        // Replace shared bundle entry w/ all it's constituent modules
        // TODO: Never matches, maybe rollup-plugin-multi-entry issue?
        load : function(id) {
            console.log(`Loading ${id} - ${id == entry}`);
            
            if(id != entry) {
                return undefined;
            }

            console.log(deps);

            return Promise.resolve(deps.map((mod) => mod.code).join("\n"));
        }
    };
}

module.exports = function(config) {
    var deps = {},
        options, shared;
    
    if(!config || !config.shared) {
        throw new Error("Must specify shared file destination");
    }

    return {
        name : name,

        // Cache original rollup options, we'll need them later to create a new
        // bundle object
        options : function(opts) {
            options = opts;
        },

        // TODO: This hook doesn't actually exist, I've hacked up the local
        // copy of rollup to:
        // 1) Call `onbeforegenerate` hooks before generating any code
        // 2) Made the `bundle` property be a live reference to the bundle object
        // 3) Put the previous `bundle` property onto `result` instead
        onbeforegenerate : function(opts, bundle) {
            // Walk bundles dependencies and build up mapping
            bundle.orderedModules.forEach((mod) => {
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
            deps = Object.keys(deps).map(
                (id) => bundle.orderedModules.findIndex(
                    (mod) => mod.id === id
                )
            );

            // Remove shared modules from the array
            deps = deps.map((idx) => bundle.orderedModules.splice(idx, 1)[0]);

            // Create new shared bundle from the shared dependencies
            // Uses original rollup options, but removes this plugin and injects
            // the newly-created replacer plugin
            shared = new Bundle(assign(options, {
                entry : entry,
                cache : {
                    modules : deps
                },
                plugins : [ replacer(deps) ].concat(
                    options.plugins.filter((plugin) => plugin.name !== name)
                )
            }));
        },

        // TODO: unused
        ongenerate : function(opts) {
            opts.bundle.shared = shared.build()
                .then(() => shared.render(opts))
                .catch((err) => {
                    throw err;
                });
        },

        // TODO: write output... somewhere?
        onwrite : function(opts) {
            console.log("onwrite");
        }
    };
};
