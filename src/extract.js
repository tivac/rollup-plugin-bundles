"use strict";

var consts = require("./constants.js");

// Return an array of dependencies for a module id (including that id)
function dependencies(bundle, id) {
    var deps = bundle.moduleById.get(id).dependencies;
    
    return [ id ].concat(deps.map((m) => m.id));
}

// Remove a module from an array by id
function remove(src, id) {
    var idx = src.findIndex((m) => m.id === id);

    return idx !== -1 ? src.splice(idx, 1)[0] : false;
}

// Extract a module from the bundle
function extract(bundle, ids) {
    return ids.map((id) => {
        bundle.moduleById.delete(id);

        remove(bundle.modules, id);

        bundle.modules.forEach((m) => remove(m.dependencies, id));

        return remove(bundle.orderedModules, id);
    });
}

// Extract any modules that 2+ other modules depend on
exports.common = function(bundle) {
    var deps = {};
    
    // Walk modules & build up reverse dependency tree
    bundle.modules.forEach((m) => {
        m.dependencies.forEach((dep) => {
            var id = dep.id;
            
            if(!deps[id]) {
                deps[id] = [];
            }

            deps[id].push(m.id);
        });
    });

    return extract(
        bundle,
        Object.keys(deps)
            // Only modules with 2+ other modules depend on
            .filter((id) => deps[id].length > 1)
            // Including their dependencies
            .map((id) => dependencies(bundle, id))
            // In a flattened array
            .reduce(((a, b) => a.concat(b)), [])
    );
};

// Extract all dependencies of the passed entries
exports.entries = function(bundle, entries) {
    var src = bundle.moduleById.get(consts.entry);

    return entries.map((entry) =>
        extract(
            bundle,
            dependencies(bundle, src.resolvedIds[entry])
        )
    );
};
