# Getting setup locally
1. Install git and clone this repository using `git clone https://github.com/evan10s/drive-safe.git`
1. Install [node.js](https://nodejs.org/en/download/) on your computer.  This should also install a package manager called npm.
2. Open a terminal in this directory.  Then run `npm install`<br>
    a. Windows only: When the package `gyp` is installed, you might get an error about `MSBUILD`.  If this happens, follow these
    instructions: https://github.com/chjj/pty.js/issues/60#issuecomment-284125481
3. See the *Setting up .env* section below for details on environment variables required
4. Install [MongoDB](https://www.mongodb.com/download-center/community), and if desired, [MongoDB Compass](https://www.mongodb.com/download-center/compass)
5. Start MongoDB on your computer
6. You can run the app locally by running `npm start`
7. Access your local instance by going to [localhost:3000](localhost:3000) in your browser.

# Setting up .env
1. Copy .env.example to a new file called .env
2. Fill in the values as necessary to provide a value for all the required environment variables

| Name | Expected value |
-------|----------------|
| SESSIONS_SECRET_KEY | String of 50 letters, numbers, or symbols to use as a secret key for sessions |
| DB_CONNECTION_STRING | MongoDB connection string; if running locally, the default value in .env.example should work |
| PROD=false | True for a production instance; false for a development instance |
| AUTOMATIC_CLIENT_ID | Client ID for authentication using Automatic |
| AUTOMATIC_CLIENT_SECRET | Client secret for authentication using Automatic |


# Development
All development work should happen off in a branch off the `master` branch.  Once you're finished, create a pull request to merge your branch into master.

# Deploying on Heroku
1. The master branch auto-deploys to https://drive-safe-staging.herokuapp.com/
2. To deploy to the production site, access the Heroku pipeline and promote the staging build to production