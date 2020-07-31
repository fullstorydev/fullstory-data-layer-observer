# Web Embed Lab

Web Embed Lab (WEL) is an [open source tool](https://github.com/fullstorydev/web-embed-lab) used to test that embedded scripts (like the DLO) don't negatively affect customer sites.

## Configuration

WEL uses Browserstack and ngrok so you'll need to set up a `.env` configuration file or environment variables to give WEL the information it needs.  Read the [environment vars doc](https://github.com/fullstorydev/web-embed-lab/blob/master/docs/ENVIRONMENT_VARS.md) in the WEL repo for details.

You'll also need to copy the `ngrok-auto-formulate-config.yml.example` into `ngrok-auto-formulate-config.yml.example`

To test the DLO with WEL, there are two npm targets:

## Autoformulate

The following command will capture example sites "freeze dry" them into replayable pages (WEL calls them "page formulas") in which we can run tests.

```bash
	npm run test:wel-auto-formulate
```

## Run tests

The following command will run tests in the replayable pages that were captured using the command above.

```bash
	npm run test:wel-runner
```
