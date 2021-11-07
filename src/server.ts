import {Action} from 'akuma-microservice-framework/lib/adapters/action-protocol/transport/action';
import {SecurityAccess} from 'akuma-microservice-framework/lib/adapters/action-protocol/security-access';
import {ProtocolServerAdapter} from 'akuma-microservice-framework/lib/adapters/action-protocol/transport/server';
import {initializeGRPC} from './grpc';
import {Config} from './config';

export const GRPCServer = {
  create: (
    actions: Map<string, Action>,
    configInstance: unknown,
    securityAccess: SecurityAccess,
    app: any
  ) => {
    const config = configInstance as Config;
    initializeGRPC(config, actions, securityAccess, app);
  },
} as ProtocolServerAdapter;
