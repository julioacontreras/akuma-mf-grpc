import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {SecurityAccess} from 'akuma-microservice-framework/adapters/action-protocol/security-access';
import {ProtoGrpcType} from 'action-grpc/src/data';
import {AppServiceHandlers} from 'action-grpc/src/appPackage/AppService';
import {printStartService} from '../akuma-microservice-framework/infrastructure/display';
import {Config} from './config';
import {Action} from 'akuma-microservice-framework/adapters/action-protocol/transport/action';
import {MicroServiceError} from 'akuma-microservice-framework/adapters/action-protocol/exception/microServiceError';

export const initializeGRPC = (
  config: Config,
  actions: Map<string, Action>,
  securityAccess: SecurityAccess,
  app: any
) => {
  connect(config, actions, securityAccess, app);
};

const connect = (
  config: Config,
  actions: Map<string, Action>,
  securityAccess: SecurityAccess,
  app: any
) => {
  const server = startServer(config, actions, securityAccess, app);
  server.bindAsync(
    `${config.host}:${config.port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error(err);
        return;
      }
      printStartService('Server gRPC on port', String(port));
      server.start();
    }
  );
};

function startServer(
  config: Config,
  actions: Map<string, Action>,
  securityAccess: SecurityAccess,
  app: any
) {
  const packageDef = protoLoader.loadSync(config.protoFile);
  const grpcObj = grpc.loadPackageDefinition(
    packageDef
  ) as unknown as ProtoGrpcType;
  const appPackage = grpcObj.appPackage;
  const server = new grpc.Server();
  const metric = app.getMetric()
  metric.createCounterRequestTotalOperators();
  metric.createHistogramRequestDuration();

  server.addService(appPackage.AppService.service, {
    sendToService: async (req, res) => {
      const start = metric.startTime();
      const actionName = req.request.action
      const action = actions.get(actionName);
      metric.sumOneRequest(actionName);
      if (!action) {
        res(null, {data: JSON.stringify({
          error: 'grpc',
          message: 'Not found action'
        })});
        return
      }

      if (!securityAccess.checkAccess(req.request.token)) {
        metric.calculeHistogramRequestDuration(start, actionName)
        res(null, {data: JSON.stringify({
          error: 'grpc',
          message: 'Token not allowed'
        })});
        return
      }

      try {
        metric.calculeHistogramRequestDuration(start, actionName)
        const dataResponse = await action.run(req.request.data);
        res(null, {data: JSON.stringify(dataResponse)});  
      } catch (error) {
        metric.calculeHistogramRequestDuration(start, actionName)
        error = error as MicroServiceError 
        res(null, {data: JSON.stringify(error.getData())});  
      }
    },
  } as AppServiceHandlers);
  return server;
}
