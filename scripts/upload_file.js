const commander = require('commander');
const fs = require('fs');
const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;
const path = require('path');

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-t, --token <token>', 'drop box token')
  .option('-f, --file <file>', 'file to upload')
  .parse(process.argv);

if (commander.token === undefined || commander.file === undefined) {
  console.log("Error: token and file are required");
  process.exit(1);
}

if (fs.existsSync(commander.file) === false) {
  console.log(`Error: file ${commander.file} doesn't exists`);
  process.exit(1);
}

var dbx = new Dropbox({ accessToken: commander.token, fetch: fetch });

dbx.filesUpload({
  contents: fs.readFileSync(commander.file),
  path: `/lmds 2019-2020/${path.basename(commander.file)}`,
  mode: 'overwrite'
}).then(function(response) {
  console.log(`Info: file uploaded to "${response.path_display}"`);
})
.catch(function(error) {
  console.error(error);
});
