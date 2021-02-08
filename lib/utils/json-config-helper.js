const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  getJsonConfig,
  updateJsonConfig,
  getJsonFilePath,
};

function getJsonFilePath(projPath) {
  return path.join(projPath, config.JSON_CONFIG_FILE);
}

function getJsonConfig(projPath) {
  const json = readJson(projPath);
  json.outDir = json.outDir || '.';
  return json;
}

function updateJsonConfig(projPath, { projectId, outDir }) {
  let shouldWrite = false;
  const json = readJson(projPath);
  if (!json.projectId || json.projectId !== projectId) {
    json.projectId = projectId;
    shouldWrite = true;
  }

  if (!json.outDir || json.outDir !== outDir) {
    json.outDir = outDir;
    shouldWrite = true;
  }

  if (shouldWrite) {
    writeJson(projPath, json);
  }
}

function readJson(projPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(projPath, config.JSON_CONFIG_FILE)));
  } catch (error) {
    return {};
  }
}

function writeJson(projPath, json) {
  const { projectId, outDir, routes, ...others } = { ...json };

  try {
    // write ordered
    fs.writeFileSync(
      path.join(projPath, config.JSON_CONFIG_FILE),
      JSON.stringify(
        {
          projectId,
          outDir: outDir || '.',
          routes: routes || [],
          ...others,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.log(`failed to update ${config.JSON_CONFIG_FILE}`, error);
  }
}
