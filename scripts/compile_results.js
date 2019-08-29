const fs = require('fs');
const commander = require('commander');
const csv = require('csv-parser');
const moment = require('moment');

const daysIndex = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6
};

const updateResult = (result, ts, teacher, studentId, day, hour, minutes, selected) => {

  const eventDate = moment(ts, 'x');
  const dayIndex = parseInt(eventDate.get('d'));

  /*
  if (eventDate.getDay() !== daysIndex[day]) {
    console.log('Ts day is not equal to registered day');
    return;
  }
  */

  const studentIndex = result.findIndex(student => student.id === studentId);
  const year = parseInt(eventDate.format('YYYY'));
  const week = parseInt(eventDate.format('w'));

  if (studentIndex === -1) {
    if (selected === false) {
      return;
    }

    result.push({id: studentId, year: {[year]: [week]}});

    return;
  }

  if (result[studentIndex].year[year] === undefined) {
    if (selected === false) {
      return;
    }

    result[studentIndex].year[year] = [week];

    return;
  }

  if (selected === false) {

    result[studentIndex].year[year] = 
      result[studentIndex].year[year].filter(currentWeek => currentWeek !== week);

    return;
  }

  if (result[studentIndex].year[year].indexOf(week) === -1) {
    result[studentIndex].year[year].push(week);
  }
}

const main = async (file, output) => {

  const result = JSON.parse(fs.readFileSync(output)) ;

  fs.createReadStream(file)
    .pipe(csv({separator: ';', headers: false}))
    .on('data', (data) => {
      updateResult(
        result,
        parseInt(data[0]),
        data[1],
        parseInt(data[2]),
        data[3],
        parseInt(data[4]),
        parseInt(data[5]),
        data[6] === '1'
      );
    })
    .on('end', () => {
      fs.writeFileSync(output, JSON.stringify(result));
      fs.renameSync(file, `${file}.${moment().format('x')}`);
    });
}

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-f, --file <file>', 'input file name')
  .option('-o, --output <output>', 'output file name')
  .parse(process.argv);

if (commander.file === undefined || commander.output === undefined) {
  console.log("file and output are required");
  process.exit(1);
}

try {
  if (fs.existsSync(commander.file) === false) {
    console.log(`file ${commander.file} doesn't exists`);
    process.exit(1);
  } 

  if (fs.existsSync(commander.output) === false) {    
    fs.writeFileSync(commander.output, '[]');
  }
  
  main(commander.file, commander.output);
  
} catch (err) {
  console.log(err);
}
