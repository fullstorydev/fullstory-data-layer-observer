
The `{repo}/src/embed/` directory holds the files related to embedding the Data Layer Observer.

You won't need this if you're including the DLO via its npm package.

In order to embed the Data Layer Observer in a web page it is necessary to:
- build and bundle the source
- load the source code in a `script` HTML element
- provide configuration to the DLO using a snippet of Javascript

To build and bundle we use Rollup.js via `npm run build` which creates `{repo}/build/dlo.min.js`.
