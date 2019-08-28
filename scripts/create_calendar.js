const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const accents = require('remove-accents');
const commander = require('commander');

const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const main = async (file, output) => {
  let calendar = {};
  const groupAndTeacherCorres = {};
  
  try {

    (await readXlsxFile(file, { sheet: 'Groupes' }))
      .map(group => ({slot: group[0], teacher: group[1]}))
      .filter(group => 
        group.teacher !== null 
        && group.teacher !== 'Prof' 
        && group.slot.search(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i) !== -1
      )
      .forEach(group => {
        if (calendar[group.teacher] === undefined) {
          calendar[group.teacher] = {};
        }
        calendar[group.teacher][group.slot] = [];
        groupAndTeacherCorres[group.slot] = group.teacher;
      });

    (await readXlsxFile(file, { sheet: 'Elèves' }))
      .map(row => ({
        id: row[0], 
        firstname: row[2], 
        lastname: row[1], 
        status: row[3], 
        slot: row[7]
      }))
      .filter(student => typeof student.status === 'string' && student.status.toUpperCase() === 'ACTIF')
      .forEach(student => {
        if (groupAndTeacherCorres[student.slot] === undefined) {
          return;
        }

        const teacher = groupAndTeacherCorres[student.slot];

        if (calendar[teacher] === undefined || calendar[teacher][student.slot] === undefined) {
          return;
        }

        calendar[groupAndTeacherCorres[student.slot]][student.slot].push({
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname
        });
      });

    calendar = Object.keys(calendar)
      .map(teacherName => ({name: teacherName, slots: calendar[teacherName]}))
      .sort((a, b) => a.name.localeCompare(b.name));

    calendar.forEach((row, index) => {
      calendar[index].slots = Object.keys(row.slots)
        .map(slotName => {
          
          const slotDef = slotName.match(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) ([0-9]{1,2})h([0-9]{1,2})* - ([0-9])/i);

          if (slotDef === null) {
            return null;
          }

          return {
            day: slotDef[1].toLowerCase(),
            hour: parseInt(slotDef[2]),
            minutes: slotDef[3] === undefined ? 0 : parseInt(slotDef[3]),
            room: parseInt(slotDef[4]),
            students: row.slots[slotName].sort((a, b) => a.lastname.localeCompare(b.lastname))
          };
        })
        .filter(slot => slot !== null && slot.students.length !== 0)
        .sort((a, b) => {
          return days.indexOf(a.day) > days.indexOf(b.day)
            || a.hour > b.hour
            || a.minutes > b.minutes;
        });
    });

    calendar = calendar.filter(teacher => teacher.slots.length);

    fs.writeFileSync(output, JSON.stringify(calendar)); 

  } catch (error) {
    console.log(error);
  }
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
  
  main(commander.file, commander.output);
  
} catch (err) {
  console.log(err);
}
