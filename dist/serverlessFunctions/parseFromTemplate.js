"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

const isServerlessFunction = ({
  Type
}) => Type === 'AWS::Serverless::Function';

const isApiEvent = ({
  Type
}) => Type.includes('Api');

const resolveEnvValue = parameters => val => typeof val === 'object' && 'Ref' in val ? parameters[val.Ref] || val.Ref : val;

const mapValues = (f, env) => Object.keys(env).reduce((curr, k) => ({ ...curr,
  [k]: f(env[k])
}), {});

const buildFnPathData = path => {
  const splittedPath = path.slice(1).split('/');
  const splittedData = splittedPath.map(part => {
    const isParameter = part.startsWith('{');
    const data = isParameter ? part.replace(/{|}/g, '') : part;
    return {
      isParameter,
      data
    };
  });
  return {
    full: path,
    splitted: splittedData
  };
};

var _default = (template, envVars, portOffset, basePath, parameters = {}) => {
  var _template$Globals$Fun, _template$Globals;

  const functionGlobals = (_template$Globals$Fun = template === null || template === void 0 ? void 0 : (_template$Globals = template.Globals) === null || _template$Globals === void 0 ? void 0 : _template$Globals.Function) !== null && _template$Globals$Fun !== void 0 ? _template$Globals$Fun : {};
  return Object.entries(template.Resources) // eslint-disable-next-line no-unused-vars
  .filter(([_, resource]) => isServerlessFunction(resource)).flatMap(([name, resource]) => {
    var _resource$Properties$, _resource$Properties;

    return Object.values((_resource$Properties$ = (_resource$Properties = resource.Properties) === null || _resource$Properties === void 0 ? void 0 : _resource$Properties.Events) !== null && _resource$Properties$ !== void 0 ? _resource$Properties$ : {}).filter(isApiEvent).map((ApiEvent, i, apiEvents) => [name + (apiEvents.length > 1 ? `_${i}` : ''), {
      ApiEvent,
      ...resource
    }]);
  }).reduce((result, [name, resource], i) => {
    var _functionGlobals$Envi, _resource$Properties$2;

    const {
      Handler: handler = functionGlobals.Handler,
      Runtime: runtime = functionGlobals.Runtime,
      CodeUri: codeUri = functionGlobals.CodeUri,
      MemorySize: memorySize = functionGlobals.MemorySize,
      Timeout: timeout = functionGlobals.Timeout
    } = resource.Properties;
    const {
      Type,
      Properties: {
        Path,
        Method,
        PayloadFormatVersion
      }
    } = resource.ApiEvent;
    const environment = mapValues(resolveEnvValue(parameters), { ...((_functionGlobals$Envi = functionGlobals.Environment) === null || _functionGlobals$Envi === void 0 ? void 0 : _functionGlobals$Envi.Variables),
      ...((_resource$Properties$2 = resource.Properties.Environment) === null || _resource$Properties$2 === void 0 ? void 0 : _resource$Properties$2.Variables),
      ...envVars[name]
    });
    return result.concat({
      name,
      handler,
      memorySize,
      timeout,
      environment,
      event: {
        type: Type,
        payloadFormatVersion: PayloadFormatVersion
      },
      path: buildFnPathData(Path),
      method: Method.toLowerCase(),
      containerPort: portOffset + i,
      dockerImageWithTag: `lambci/lambda:${runtime}`,
      distPath: (0, _path.join)(basePath, codeUri)
    });
  }, []);
};

exports.default = _default;