/* eslint no-console: "off" */
"use strict";

var Bundle = require("rollup").Bundle,
    
    pick   = require("lodash.pickby"),
    assign = require("lodash.assign"),

    consts = require("./constants.js"),
    plugin = require("./load-shared.js");

module.exports = function(config) {
    var deps = {},
        options, shared;
    
    if(!config || !config.shared) {
        throw new Error("Must specify shared file destination");
    }

    return {
        name : consts.name,

        // Cache original options & rewrite entry (if it's an Array')
        options : function(opts) {
            if(!opts) {
                opts = false;
            }
            
            options = opts;

            if(opts.entry === consts.entry) {
                return;
            }

            // Save actual entries files & replace w/ dummy entry file
            config.entries = opts.entry;
            opts.entry = consts.entry;
        },

        resolveId : function(id) {
            return id === consts.entry ? consts.entry : undefined;
        },

        load : function(id) {
            if(id !== consts.entry) {
                return undefined;
            }

            return config.entries.map((entry) => `import ${JSON.stringify(entry)};`).join("\n");
        },

        // TODO: This hook doesn't actually exist, I've hacked up github.com/tivac/rollup#splitting
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
                entry : consts.entry,
                cache : {
                    modules : deps
                },
                plugins : [ plugin(deps) ].concat(
                    options.plugins.filter((p) => p.name !== consts.name)
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
