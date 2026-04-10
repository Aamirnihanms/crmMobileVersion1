const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom config plugin to add `use_modular_headers!` to the iOS Podfile.
 * Required by @react-native-firebase when building as static libraries.
 */
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes('use_modular_headers!')) {
        // Insert at the very top of the Podfile
        contents = 'use_modular_headers!\n' + contents;
        fs.writeFileSync(podfilePath, contents);
        console.log('✅ withModularHeaders: added use_modular_headers! to Podfile');
      } else {
        console.log('ℹ️  withModularHeaders: use_modular_headers! already present');
      }

      return config;
    },
  ]);
};
