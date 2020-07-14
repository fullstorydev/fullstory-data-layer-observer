import {terser} from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/embed/init.ts',
  output: [
    {
      format: 'cjs',
      file: 'build/dlo.js'
    },
    {
      file: 'build/dlo.min.js',
      format: 'cjs',
      name: 'version',
      plugins: [terser()]
    }
  ],
  plugins: [
    typescript({
      target: "es5",
      module: "es2015",
      declaration: false,
      declarationMap: false,
      sourceMap: false,
      resolveJsonModule: false
    })
  ]
};