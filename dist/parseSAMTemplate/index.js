"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _yamlCfn = require("yaml-cfn");

var _default = async templateYaml => (0, _yamlCfn.yamlParse)(templateYaml);

exports.default = _default;