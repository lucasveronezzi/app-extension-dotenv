/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */

const fs = require('fs')
const semver = require('semver')

const extendConf = function (api, conf) {
  let envName = '.env' // default name

  let nameEnv = null

  // Get the file name of the environment if the param --env or -e was informed
  process.argv.forEach((v, k) => {
    if (v.indexOf('--env') === 0 || v.indexOf('-e') === 0) {
      nameEnv = process.argv[k + 1]
    }
  })

  // If the file name was informed, i will use that, otherwise i use from ctx.dev (default of this plugin)
  if (nameEnv) {
    envName = nameEnv
  } else {
    // get .env name based on dev or production
    if (conf.ctx.dev === true) {
      // your prompt data is in api.prompts
      if (api.prompts.env_development) {
        envName = api.prompts.env_development
      }
    }
    else {
      if (api.prompts.env_production) {
        envName = api.prompts.env_production
      }
    }
  }

  // see if there is anything to do
  if (envName === void 0 || envName === '') {
    return
  }

  // resolve the path to the file
  const envPath = api.resolve.app(envName)

  // check file exists
  if (!fs.existsSync(envPath)) {
    console.log(`App Extension (dotenv): '${envName}' file missing; skipping`)
    return
  }

  // dotenv options
  const envOptions = {
    encoding: 'utf8',
    path: envPath
  }

  const { config } = require('dotenv')
  const result = config(envOptions)

  // check for dotenv error
  if (result.error) {
    console.error(`App Extension (dotenv): Error '${result.error}'`)
    process.exit(1)
  }

  const version = api.getPackageVersion('@quasar/app')
  const v1 = semver.lt(version, '2.0.0')

  // get parsed data
  const parsed = result.parsed

  // for brevity
  let target = conf.build.env

  // check for common root object
  if (api.prompts.common_root_object && api.prompts.common_root_object !== 'none') {
    let rootObject = api.prompts.common_root_object

    if (!target[rootObject]) {
      target[rootObject] = {}
      target = target[rootObject]
    }
  }

  for (const key in parsed) {
    target[key] = v1 === true ? JSON.stringify(parsed[key]) : parsed[key]
  }
}

module.exports = function (api) {
  // Quasar compatibility check; you may need
  // hard dependencies, as in a minimum version of the "quasar"
  // package or a minimum version of "@quasar/app" CLI
  // api.compatibleWith('quasar', '^1.1.1')
  api.compatibleWith('@quasar/app', '^1.1.0 || ^2.0.0')

  // We extend /quasar.conf.js
  api.extendQuasarConf((conf) => {
    extendConf(api, conf)
  })
}
