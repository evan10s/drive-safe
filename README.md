# Getting setup locally
1. Install [node.js](https://nodejs.org/en/download/) on your computer.  This should also install a package manager called npm.
2. Open a terminal in this directory.  Then run `npm install`<br>
    a. Windows only: When the package `gyp` is installed, you might get an error about `MSBUILD`.  If this happens, follow these
    instructions: https://github.com/chjj/pty.js/issues/60#issuecomment-284125481
3. <placeholder for .env file>
4. You can run the app locally by running `npm start`
5. Access your local instance by going to [localhost:3000](localhost:3000) in your browser.

# Development
All development work should happen off of the `master` branch.  Once you're finished, create a pull request to merge your branch into master.

# Deploying
1. The master branch auto-deploys to https://drive-safe-staging.herokuapp.com/
2. To deploy to the production site, access the Heroku pipeline and promote the staging build to production