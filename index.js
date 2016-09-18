/* eslint no-console: "off" */
"use strict";

var Bundle = require("rollup").Bundle,
    
    pick   = require("lodash.pickby"),
    assign = require("lodash.assign"),
    
    replacer = require("./replacer.js"),

    name  = require("./package.json").name,
    entry = `\0${name}:entry`;

module.exports = function(config) {
    var deps    = {},
        options, shared, entries;
    
    if(!config || !config.shared) {
        throw new Error("Must specify shared file destination");
    }

    return {
        name : name,

        // Cache original rollup options
        // Rewrite entry so we can support an array of entries
        options : function(opts) {
            options = opts;

            entries = Array.isArray(options.entry) ? options.entry : [ options.entry ];
            
            // Need to rewrite to singular entry so rollup can handle it
            if(options.entry === entries) {
                options.entry = entry;
            }
        },

        // Ensure special shared bundle entry doesn't get resolved by other plugins
        resolveId : (id) => (id === entry ? entry : undefined),

        // Replace shared bundle entry w/ all it's constituent modules
        load : (id) => (id === entry ?
            Promise.resolve(
                entries.map((mod) => `import ${JSON.stringify(mod)};`).join("\n")
            ) :
            undefined
        ),

        // TODO: This hook doesn't actually exist, I've hacked up the local
        // copy of rollup to:
        // 1) Call `onbeforegenerate` hooks before generating any code
        // 2) Pass the bundle object as another arg
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
            deps = Object.keys(deps).map((id) =>
                bundle.orderedModules.findIndex((mod) =>
                    mod.id === id
                )
            );

            // Remove shared modules from the array
            deps = deps.map((idx) => bundle.orderedModules.splice(idx, 1)[0]);

            // Create new shared bundle from the shared dependencies
            // Uses original rollup options, but removes this plugin and injects
            // the replacer plugin
            shared = new Bundle(assign(options, {
                entry : replacer.entry,
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
