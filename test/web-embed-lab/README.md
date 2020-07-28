# Web Embed Lab

The Web Embed Lab (WEL) is an [open source tool](https://github.com/fullstorydev/web-embed-lab) used to test that embedded scripts (like the DLO) don't negatively effect customer sites.

## Configuration

The WEL uses Browserstack so you'll need to set up a `.env` configuration file or environment variables to give the WEL the information it needs for your Browserstack account.  Read the [environment vars doc](https://github.com/fullstorydev/web-embed-lab/blob/master/docs/ENVIRONMENT_VARS.md) in the WEL repo for details.

To test the DLO with the WEL, there are two npm targets:

## Autoformulate

The following command will capture example sites "freeze dry" them into replayable pages (WEL calls them "page formulas") in which we can run tests.

	npm run test:wel-auto-formulate


## Run tests

The following command will run tests in the replayable pages that were captured using the command above.

	npm run test:wel-runner

