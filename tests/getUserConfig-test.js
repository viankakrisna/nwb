import expect from 'expect'
import webpack from 'webpack'

import {ConfigValidationError} from '../src/errors'
import getUserConfig, {prepareWebpackRuleConfig, processUserConfig} from '../src/getUserConfig'

describe('getUserConfig()', () => {
  it("throws an error when a required config file can't be found", () => {
    expect(() => getUserConfig({config: 'tests/fixtures/nonexistent.js'}, {required: true}))
      .toThrow(/Couldn't find a config file/)
  })

  it('throws an error when the config file is invalid or otherwise causes an error', () => {
    expect(() => getUserConfig({config: 'tests/fixtures/invalid-config.js'}))
      .toThrow(/Couldn't import the config file/)
  })

  it("returns default config when a non-required config file can't be found", () => {
    let config = getUserConfig()
    expect(config).toEqual({
      babel: {},
      karma: {},
      npm: {},
      webpack: {},
    })
  })
})

function check(config, path, message) {
  try {
    process(config)
    expect(config).toNotExist('should have thrown a validation error')
  }
  catch (e) {
    expect(e).toBeA(ConfigValidationError)
    expect(e.report.errors[0]).toMatch({path, message})
  }
}

function process(config) {
  return processUserConfig({userConfig: config})
}

describe('processUserConfig()', () => {
  describe('validation', () => {
    it('config file has an invalid type', () => {
      check({type: 'invalid'}, 'type', /Must be/)
    })
    it('babel.stage is not a number, or falsy', () => {
      check({babel: {stage: []}}, 'babel.stage', /Must be/)
    })
    it('babel.stage is out of bounds', () => {
      check({babel: {stage: -1}}, 'babel.stage', /Must be/)
      check({babel: {stage: 4}}, 'babel.stage', /Must be/)
    })
    it('babel.presets is not an array', () => {
      check({babel: {presets: 'some-preset'}}, 'babel.presets', /Must be/)
    })
    it('babel.plugins is not an array', () => {
      check({babel: {plugins: 'some-plugin'}}, 'babel.plugins', /Must be/)
    })
    it('babel.runtime is not valid', () => {
      check({babel: {runtime: 'welp'}}, 'babel.runtime', /Must be/)
    })
    it('webpack.copy is an invalid type', () => {
      check({webpack: {copy: /test/}}, 'webpack.copy', /Must be/)
    })
    it('webpack.copy is an object missing config', () => {
      check({webpack: {copy: {}}}, 'webpack.copy', /Must include/)
    })
    it('webpack.copy.patterns is not an array', () => {
      check({webpack: {copy: {patterns: {}}}}, 'webpack.copy.patterns', /Must be/)
    })
    it('webpack.copy.options is not an object', () => {
      check({webpack: {copy: {options: []}}}, 'webpack.copy.options', /Must be/)
    })
  })

  describe('convenience shorthand', () => {
    it('allows npm.umd to be a string', () => {
      let config = process({npm: {umd: 'test'}})
      expect(config.npm.umd).toEqual({global: 'test'})
    })
    it('allows webpack.autoprefixer to be a browser string', () => {
      let config = process({webpack: {autoprefixer: 'test'}})
      expect(config.webpack.autoprefixer).toEqual({browsers: 'test'})
    })
    it('allows webpack.postcss to be an array', () => {
      let config = process({webpack: {postcss: ['test']}})
      expect(config.webpack.postcss).toEqual({defaults: ['test']})
    })
    it('allows webpack.copy to be an array', () => {
      let config = process({webpack: {copy: ['test']}})
      expect(config.webpack.copy).toEqual({patterns: ['test']})
    })
  })

  it('passes command and webpack arguments when a config function is provided', () => {
    let config = processUserConfig({
      args: {_: ['abc123']},
      userConfig(args) {
        return {
          command: args.command,
          webpack: args.webpack,
        }
      }
    })
    expect(config.command).toEqual('abc123')
    expect(config.webpack).toEqual(webpack)
  })

  it('defaults top-level config when none is provided', () => {
    let config = processUserConfig({
      userConfig: {
        type: 'web-module',
      },
    })
    expect(config).toEqual({
      type: 'web-module',
      babel: {},
      karma: {},
      npm: {},
      webpack: {},
    })
  })

  // TODO Remove in a future release
  it('converts babel.loose to boolean for 0.12 back-compat', () => {
    let config = processUserConfig({
      userConfig: {
        babel: {
          loose: 'all',
        }
      }
    })
    expect(config.babel).toEqual({loose: true})
  })

  // TODO Remove in a future release
  it('upgrades build config to npm config for 0.12 back-compat', () => {
    let config = processUserConfig({
      userConfig: {
        build: {
          externals: {'react': 'React'},
          global: 'MyComponent',
          jsNext: true,
          umd: true,
        }
      },
      userConfigPath: '/test/path/to/nwb.config.js'
    })
    expect(config.build).toNotExist()
    expect(config.npm).toEqual({
      esModules: true,
      umd: {
        externals: {'react': 'React'},
        global: 'MyComponent',
      }
    })
  })
})

describe('prepareWebpackRuleConfig()', () => {
  it('does nothing if a query object is already present', () => {
    let config = {
      css: {
        test: /test/,
        include: /include/,
        exclude: /exclude/,
        options: {
          a: 42,
        },
        other: true,
      },
    }
    prepareWebpackRuleConfig(config)
    expect(config.css).toEqual({
      test: /test/,
      include: /include/,
      exclude: /exclude/,
      options: {
        a: 42,
      },
      other: true,
    })
  })
  it('moves non-loader props into a query object', () => {
    let config = {
      css: {
        test: /test/,
        include: /include/,
        exclude: /exclude/,
        modules: true,
        localIdentName: 'asdf',
      },
    }
    prepareWebpackRuleConfig(config)
    expect(config.css).toEqual({
      test: /test/,
      include: /include/,
      exclude: /exclude/,
      options: {
        modules: true,
        localIdentName: 'asdf',
      },
    })
  })
})
