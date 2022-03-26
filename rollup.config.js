import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/embed/init.ts',
  output: [
    {
      format: 'iife',
      file: 'build/dlo.js',
    },
    {
      file: 'build/dlo.min.js',
      format: 'cjs',
      name: 'version',
      plugins: [terser({
        enclose: true,
      })],
    },
  ],
  plugins: [
    json(),
    typescript({
      target: 'es5',
      module: 'es2015',
      declaration: false,
      declarationMap: false,
      sourceMap: false,
      resolveJsonModule: true,
      moduleResolution: 'node',
    }),
  ],
};
