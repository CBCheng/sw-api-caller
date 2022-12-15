import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'
import del from 'rollup-plugin-delete'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export default {
  input: "./src/main.js",
    output: [
    {
      file: 'dist/main.es.js',
      format: 'es',
    },
    {
      file: 'dist/main.umd.js',
      format: 'umd',
      name: 'bundle-name',
    },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    commonjs(),
    json(),
    babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
    nodePolyfills(),
    nodeResolve({ preferBuiltins: false }),
    terser(),
    peerDepsExternal()
  ]
}