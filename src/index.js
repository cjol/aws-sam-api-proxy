import path from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import parseSAMTemplate from './parseSAMTemplate';
import { parseFunctionsFromTemplate } from './serverlessFunctions';
import spinUpServer from './server';

const encoding = 'utf-8';
const readFileAsync = promisify(readFile);

const getEnvVars = async ({ envVars, basePath }) => {
  if (envVars === undefined) return {};
  const envVarsPath = path.join(basePath, envVars);
  const envVarsString = await readFileAsync(envVarsPath, encoding);
  return JSON.parse(envVarsString);
};

const getTemplate = async ({ basePath, template }) => {
  const templatePath = path.join(basePath, template);
  return readFileAsync(templatePath, encoding).then(parseSAMTemplate);
};

const getRequiredDependencies = async (options) => {
  const [envVars, template] = await Promise.all([getEnvVars(options), getTemplate(options)]);
  return { envVars, template };
};

export default async (dockerService, options) => {
  const { template, envVars } = await getRequiredDependencies(options);

  const { apiName, basePath, port } = options;
  const portOffset = port + 1;
  const functions = parseFunctionsFromTemplate(template, envVars, portOffset, basePath);

  await Promise.all([
    dockerService.removeApiContainers(apiName),
    dockerService.pullRequiredDockerImages(functions),
  ]);

  await dockerService.createContainers(functions, options);

  spinUpServer(functions, port, apiName);
};
