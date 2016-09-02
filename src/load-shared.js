"use strict";

var consts = require("./constants.js");

module.exports = function(deps) {
    return {
        name : `${consts.name}-replacer`,

        // Ensure special shared bundle entry doesn't get resolved by other plugins
        resolveId : function(id) {
            if(id !== consts.entry) {
                return undefined;
            }

            return consts.entry;
        },

        // Replace shared bundle entry w/ all it's constituent modules
        // TODO: Don't think that code is correct...
        load : function(id) {
            if(id !== consts.entry) {
                return undefined;
            }

            console.log(deps);

            return Promise.resolve(deps.map((mod) => mod.code).join("\n"));
        }
    };
}
