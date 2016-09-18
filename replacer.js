"use strict";

var name  = `${require("./package.json").name}-replacer`,
    entry = `\0${name}:entry`;

module.exports = function(deps) {
    return {
        name : `${name}`,

        // Ensure special shared bundle entry doesn't get resolved by other plugins
        resolveId : function(id) {
            return id === entry ?
                entry :
                undefined;
        },

        // Replace shared bundle entry w/ all it's constituent modules
        load : function(id) {
            return id === entry ?
                Promise.resolve(deps.map((mod) => mod.code).join("\n")) :
                undefined;
        }
    };
};

module.exports.entry = entry;
