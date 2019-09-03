const commander = require('commander');
const fs = require('fs');
const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-t, --token <token>', 'drop box token')
  .option('-o, --output <output>', 'output file name')
  .option('-i, --info <info>', 'info about downloaded file')
  .parse(process.argv);

if (commander.token === undefined 
  || commander.output === undefined
  || commander.info === undefined
) {
  console.log("Error: token, output and info are required");
  process.exit(1);
}

if (fs.existsSync(commander.output) === true) {
  console.log(`Info: remove output file ${commander.output} before downloading`)
  fs.unlinkSync(commander.output);
}
  
var dbx = new Dropbox({ accessToken: commander.token, fetch: fetch });

dbx.filesListFolder({path: '/lmds 2019-2020/tableurs'})
  .then(function(response) {

    if (response.entries.length === 0) {
      console.log('Error: no entry found');
      process.exit(1);
    }

    console.log(`Info: found ${response.entries.length} entrie(s)`);

    const files = response.entries
      .filter(entry => entry['.tag'] === 'file')
      .filter(file => file.name.match(/\.xlsx$/));

    if (files.length === 0) {
      console.log('Error: no entry found with criterias: file and .xlsx extension');
      process.exit(1);
    }

    const file = files.reduce((selected, file) => 
      (new Date(file.server_modified)) > (new Date(selected.server_modified)) ?
        file : selected
    );

    if (fs.existsSync(commander.info)) {
      const downloadedFileInfo = JSON.parse(fs.readFileSync(commander.info));
      
      if (downloadedFileInfo.id !== undefined 
        && downloadedFileInfo.id === file.id
      ) {
        console.log(`Warning: file "${file.path_lower}" already downloaded`);
        process.exit(1);
      }
    }

    console.log(`Info: try to download file "${file.path_lower}"`);

    dbx.filesDownload({path: file.path_lower})
      .then(function(response) {
        console.log('Info: download ok');

        fs.writeFileSync(commander.output, response.fileBinary);
        console.log(`Info: file saved to ${commander.output}`);
        
        fs.writeFileSync(commander.info, JSON.stringify(file));
        console.log(`Info: info about file saved to "${commander.info}"`);
      })
      .catch(function (error) {
        console.error(error);
        process.exit(1);
     });

  })
  .catch(function(error) {
    console.log(error);
    process.exit(1);
  });
