var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    yaml = require('yamlparser'),
	refImpl = require('uap-ref-impl')(filterRegexes(readYAML('../regexes.yaml')));

function readYAML(fileName) {
    var file = path.join(__dirname, fileName);
    var data = fs.readFileSync(file, 'utf8');
    return yaml.eval(data);
}

function filterRegexes(yaml) {
  var result = {};
  for (var category in yaml) {
    var regexList = yaml[category];

    result[category] = regexList.filter(regex => !regex.skip).map(regex => {
      if (regex.ignore) {
        regex.family_replacement = 'Other';
      }
      return regex;
    });
  }

  return result;
}

function msg(name, actual, expected) {
  return "Expected " + name + " to be " + JSON.stringify(expected) + " got " + JSON.stringify(actual) + " instead.";
}

['../test_resources/firefox_user_agent_strings.yaml', '../tests/test_ua.yaml', '../test_resources/pgts_browser_list.yaml',
  '../test_resources/opera_mini_user_agent_strings.yaml',/*'../test_resources/podcasting_user_agent_strings.yaml'*/].forEach(function(fileName) {
  var fixtures = readYAML(fileName).test_cases;
  var skipFamilies = readYAML('../tests/skip_ua.yaml').families;
  suite(fileName, function() {
    fixtures.forEach(function(f) {
      if (!f.ignore) {
        test(f.user_agent_string, function() {
          var ua = refImpl.parse(f.user_agent_string).ua;
          fixFixture(f, ['major', 'minor', 'patch']);
          if (!f.skip && !skipFamilies.some(family => family == f.family )) {
            assert.strictEqual(ua.family, f.family, msg('ua.family', ua.family, f.family));
            assert.strictEqual(ua.major, f.major, msg('ua.major', ua.major, f.major));
            assert.strictEqual(ua.minor, f.minor, msg('ua.minor', ua.minor, f.minor));
            assert.strictEqual(ua.patch, f.patch, msg('ua.patch', ua.patch, f.patch));
          }
          else {
            // if the tests should be skipped, expect Other
            assert.strictEqual(ua.family, 'Other', msg('ua.family', ua.family, 'Other'));
          }
        });
      }
    });
  });
});

['../tests/test_os.yaml', '../test_resources/additional_os_tests.yaml'].forEach(function(fileName) {
  var fixtures = readYAML(fileName).test_cases;
  suite(fileName, function() {
    fixtures.forEach(function(f) {
      test(f.user_agent_string, function() {
        var os = refImpl.parse(f.user_agent_string).os;
        fixFixture(f, ['major', 'minor', 'patch', 'patch_minor']);
        assert.strictEqual(os.family, f.family, msg('os.family', os.family, f.family));
        assert.strictEqual(os.major, f.major, msg('os.major', os.major, f.major));
        assert.strictEqual(os.minor, f.minor, msg('os.minor', os.minor, f.minor));
        assert.strictEqual(os.patch, f.patch, msg('os.patch', os.patch, f.patch));
        assert.strictEqual(os.patchMinor, f.patch_minor, msg('os.patchMinor', os.patchMinor, f.patch_minor));
      });
    });
  });
});

['../tests/test_device.yaml'].forEach(function(fileName) {
  var fixtures = readYAML(fileName).test_cases;
  suite(fileName, function() {
    fixtures.forEach(function(f) {
      test(f.user_agent_string, function() {
        var device = refImpl.parse(f.user_agent_string).device;
        fixFixture(f, ['family', 'brand', 'model']);
        assert.strictEqual(device.family, f.family, msg('device.family', device.family, f.family));
        assert.strictEqual(device.brand, f.brand, msg('device.brand', device.brand, f.brand));
        assert.strictEqual(device.model, f.model, msg('device.model', device.model, f.model));
      });
    });
  });
});

function fixFixture(f, props) {
  // A bug in the YAML parser makes empty fixture props
  // return a vanila object.
  props.forEach(function(p) {
    if (typeof f[p] === 'object') {
      f[p] = null;
    }
  })
  return f;
}
