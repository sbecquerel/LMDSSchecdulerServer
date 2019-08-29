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

const updateCalendar = (calendar, ts, teacher, studentId, day, hour, minutes, selected) => {

  const eventDate = moment(ts, 'x');
  const dayIndex = parseInt(eventDate.get('d'));

  /*
  if (eventDate.getDay() !== daysIndex[day]) {
    console.log('Ts day is not equal to registered day');
    return;
  }
  */

  const studentIndex = calendar.findIndex(student => student.id === studentId);
  const year = parseInt(eventDate.format('YYYY'));
  const week = parseInt(eventDate.format('w'));

  if (studentIndex === -1) {
    if (selected === false) {
      return;
    }

    calendar.push({id: studentId, year: {[year]: [week]}});

    return;
  }

  if (calendar[studentIndex].year[year] === undefined) {
    if (selected === false) {
      return;
    }

    calendar[studentIndex].year[year] = [week];

    return;
  }

  if (selected === false) {

    calendar[studentIndex].year[year] = 
      calendar[studentIndex].year[year].filter(currentWeek => currentWeek !== week);

    return;
  }

  if (calendar[studentIndex].year[year].indexOf(week) === -1) {
    calendar[studentIndex].year[year].push(week);
  }
}

const main = async (file, output) => {

  const calendar = JSON.parse(fs.readFileSync(output)) ;

  fs.createReadStream(file)
    .pipe(csv({separator: ';', headers: false}))
    .on('data', (data) => {
      updateCalendar(
        calendar,
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
      console.log(calendar);
      fs.writeFileSync(output, JSON.stringify(calendar));
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
    process.exit(1);
  } 

  if (fs.existsSync(commander.output) === false) {    
    fs.writeFileSync(commander.output, '[]');
  }
  
  main(commander.file, commander.output);
  
} catch (err) {
  console.log(err);
}
