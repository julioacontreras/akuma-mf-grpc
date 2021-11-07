"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRPCServer = void 0;
var grpc_1 = require("./grpc");
exports.GRPCServer = {
    create: function (actions, configInstance, securityAccess, app) {
        var config = configInstance;
        (0, grpc_1.initializeGRPC)(config, actions, securityAccess, app);
    },
};
