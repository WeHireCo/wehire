const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  getJsonConfig,
  updateJsonConfig,
};

function getJsonConfig(projPath) {
  const json = readJson(projPath);
  json.distDir = json.distDir || '.';
  return json;
}

function updateJsonConfig(projPath, { projectId, distDir }) {
  let shouldWrite = false;
  const json = readJson(projPath);
  if (!json.projectId || json.projectId !== projectId) {
    json.projectId = projectId;
    shouldWrite = true;
  }

  if (!json.distDir || json.distDir !== distDir) {
    json.distDir = distDir;
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
  const { projectId, distDir, routes, ...others } = { ...json };

  try {
    // write ordered
    fs.writeFileSync(
      path.join(projPath, config.JSON_CONFIG_FILE),
      JSON.stringify(
        {
          projectId,
          distDir: distDir || '.',
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
