/* eslint no-console: "off" */
"use strict";

var rollup = require("rollup"),

    pick   = require("lodash.pickby"),
    assign = require("lodash.assign"),
    
    replacer = require("./replacer.js"),

    name  = require("./package.json").name,
    entry = `\0${name}:entry`;

module.exports = function(config) {
    var bundles, options, shared, entries;
    
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

        // create new Bundle instance for each entry (copy options, modify entry)
        // call resolveId().then(fetchModule(id)) on all bundles
        // Inspect modules for each bundle
        // Extract shared modules into shared bundle
        // Inject shared modules into rollup as the dynamic file
        load : (file) => (file === entry ?
            Promise.all(entries.map((id) => {
                var bundle = new rollup.Bundle(Object.assign(options, { entry : id }));

                return bundle.resolveId(bundle.entry)
                    .then((found) => bundle.fetchModule(found))
                    .then(() => bundle);
            }))
            .then((results) => {
                var deps = Object.create(null);

                // store entry bundles
                bundles = results;

                // Walk bundles dependencies and build up mapping
                bundles.forEach((bundle) =>
                    bundle.modules.forEach((module) => {
                        Object.keys(module.resolvedIds).forEach((id) => {
                            var dep = module.resolvedIds[id];

                            if(!deps[dep]) {
                                deps[dep] = [];
                            }

                            deps[dep].push(module.id);
                        });
                    })
                );

                // Filter out any non-shared deps
                deps = pick(deps, (modules) => modules.length > 1);

                return Promise.resolve(
                    Object.keys(deps).map((mod) => `import ${JSON.stringify(mod)};`).join("\n")
                );
            })
            .catch(console.error.bind(console)) :
            undefined
        ),

        // TODO: Walk entry bundles, generate using new exports I hacked into rollup
        ongenerate : function(opts) {
            // TODO: broken for some reason!
            opts.entries = Promise.all(bundles.map((bundle) =>
                bundle.build().then(() => rollup.process(bundle))
            ));
        }
    };
};
