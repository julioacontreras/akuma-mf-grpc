import { SecurityAccess } from 'akuma-microservice-framework/lib/adapters/action-protocol/security-access';
import { Config } from './config';
import { Action } from 'akuma-microservice-framework/lib/adapters/action-protocol/transport/action';
export declare const initializeGRPC: (config: Config, actions: Map<string, Action>, securityAccess: SecurityAccess, app: any) => void;
