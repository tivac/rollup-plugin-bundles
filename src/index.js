/* eslint no-console: "off" */
"use strict";

var consts  = require("./constants.js"),
    extract = require("./extract");

module.exports = function(config) {
    var options, shared;
    
    if(!config) {
        config = {};
    }

    return {
        name : consts.name,

        // Cache original options & rewrite entry to the stub we'll implement in load
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

        // Not a real file, so have to handle bogus entry here
        resolveId : function(id) {
            return id === consts.entry ? consts.entry : undefined;
        },

        // Generate fake entry file by importing all the real ones
        load : function(id) {
            if(id !== consts.entry) {
                return undefined;
            }

            return config.entries.map((entry) => `import ${JSON.stringify(entry)};`).join("\n");
        },

        // Take processed bundle, break into sub-bundles
        // TODO: This hook doesn't actually exist, I've hacked it into github.com/tivac/rollup#splitting
        onbeforegenerate : function(opts, bundle) {
            var common  = extract.common(bundle),
                entries = extract.entries(bundle, config.entries.slice(1));

            console.log("Common:\n", common, "\nEntries:\n", entries);

            // TODO: build bundle objects for common/entries
            /*
            // Create new shared bundle from the shared dependencies
            // Uses original rollup options, but removes this plugin and injects
            // the newly-created replacer plugin
            shared = new Bundle(assign(options, {
                entry : consts.entry,
                cache : {
                    modules : common
                },
                plugins : [ plugin(deps) ].concat(
                    options.plugins.filter((p) => p.name !== consts.name)
                )
            }));
            */
        },

        // TODO: unused
        // ongenerate : function(opts) {
        //     opts.bundle.shared = shared.build()
        //         .then(() => shared.render(opts))
        //         .catch((err) => {
        //             throw err;
        //         });
        // },

        // TODO: write output... somewhere?
        // onwrite : function(opts) {
        //     console.log("onwrite");
        // }
    };
};
