const path = require('path');
const webpack = require('webpack');

const { name: packageName, version, repository } = require('./package.json');

module.exports = {
  // assetsDir: 'src/data',
  usageMode: 'expand',
  exampleMode: 'expand',
  moduleAliases: {},
  components: 'src/components/**/*.jsx',
  getComponentPathLine: (componentPath) => {
    const name = path.basename(componentPath, '.jsx');
    return `import { ${name} } from '${packageName}';`;
  },
  title: `${packageName} v${version}`,
  ribbon: {
    url: repository.url,
    text: 'View on GitHub',
  },
  dangerouslyUpdateWebpackConfig(config) {
    const srcPath = path.resolve(__dirname, "src");
    config.module.rules = config.module.rules || [];
    config.module.rules.unshift({
      test: /\.[jt]sx?$/,
      include: [srcPath],
      type: "javascript/auto",
      // src uses extensionless ESM imports (e.g. './scripture')
      resolve: { fullySpecified: false },
    });
    config.experiments = {
      ...(config.experiments || {}),
      outputModule: false,
    };
    config.output = {
      ...(config.output || {}),
      module: false,
      scriptType: "text/javascript",
    };
    // CRA's ESLint plugin can't resolve eslint-plugin-jest under pnpm; linting isn't needed for the guide
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );
    config.resolve.fallback = {
      crypto: require.resolve('crypto-browserify'),
      fs: false,
    };

    config.module.rules.push({
      test: /.\.md$/,
      type: 'javascript/auto',
    });
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-styleguidist\/lib\/loaders\/utils\/client\/requireInRuntime$/,
        'react-styleguidist/lib/loaders/utils/client/requireInRuntime'
      )
    );
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-styleguidist\/lib\/loaders\/utils\/client\/evalInContext$/,
        'react-styleguidist/lib/loaders/utils/client/evalInContext'
      )
    );
    return config;
  },
};

module.exports.moduleAliases[packageName] = path.resolve(__dirname, 'src');
