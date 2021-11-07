"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGRPC = void 0;
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var display_1 = require("akuma-microservice-framework/lib/infrastructure/display");
var microServiceError_1 = require("akuma-microservice-framework/lib/adapters/action-protocol/exception/microServiceError");
var initializeGRPC = function (config, actions, securityAccess, app) {
    connect(config, actions, securityAccess, app);
};
exports.initializeGRPC = initializeGRPC;
var connect = function (config, actions, securityAccess, app) {
    var server = startServer(config, actions, securityAccess, app);
    server.bindAsync(config.host + ":" + config.port, grpc.ServerCredentials.createInsecure(), function (err, port) {
        if (err) {
            console.error(err);
            return;
        }
        (0, display_1.printStartService)('Server gRPC on port', String(port));
        server.start();
    });
};
function startServer(config, actions, securityAccess, app) {
    var _this = this;
    var packageDef = protoLoader.loadSync(config.protoFile);
    var grpcObj = grpc.loadPackageDefinition(packageDef);
    var appPackage = grpcObj.appPackage;
    var server = new grpc.Server();
    var metric = app.getMetric();
    metric.createCounterRequestTotalOperators();
    metric.createHistogramRequestDuration();
    server.addService(appPackage.AppService.service, {
        sendToService: function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var start, actionName, action, dataResponse, error_1, msError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = metric.startTime();
                        if (!req.request.action) {
                            throw new microServiceError_1.MicroServiceError('not found property action', 'grpc-error');
                        }
                        actionName = req.request.action;
                        action = actions.get(actionName);
                        metric.sumOneRequest(actionName);
                        if (!action) {
                            res(null, { data: JSON.stringify({
                                    error: 'grpc',
                                    message: 'Not found action'
                                }) });
                            return [2 /*return*/];
                        }
                        if (!req.request.token) {
                            throw new microServiceError_1.MicroServiceError('not found property token', 'grpc-error');
                        }
                        if (!securityAccess.checkAccess(req.request.token)) {
                            metric.calculeHistogramRequestDuration(start, actionName);
                            res(null, { data: JSON.stringify({
                                    error: 'grpc',
                                    message: 'Token not allowed'
                                }) });
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        metric.calculeHistogramRequestDuration(start, actionName);
                        return [4 /*yield*/, action.run(req.request.data)];
                    case 2:
                        dataResponse = _a.sent();
                        res(null, { data: JSON.stringify(dataResponse) });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        metric.calculeHistogramRequestDuration(start, actionName);
                        msError = error_1;
                        res(null, { data: JSON.stringify(msError.getData()) });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    });
    return server;
}
