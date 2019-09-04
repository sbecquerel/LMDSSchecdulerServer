const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const accents = require('remove-accents');
const commander = require('commander');

const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const status = ['ACTIF', 'GRATUIT', 'POSE'];

const main = async (file, output) => {
  let calendar = {};
  const groupAndTeacherCorres = {};
  
  try {

    (await readXlsxFile(file, { sheet: 'Groupes' }))
      .map(group => ({slot: group[0], teacher: group[1]}))
      .filter(group => 
        group.teacher !== null 
        && group.teacher !== 'Prof' 
        && group.slot !== null
        && group.slot.search(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i) !== -1
      )
      .forEach(group => {
        if (calendar[group.teacher] === undefined) {
          calendar[group.teacher] = {};
        }
        calendar[group.teacher][group.slot.toLowerCase()] = [];
        groupAndTeacherCorres[group.slot.toLowerCase()] = group.teacher;
      });

    if (Object.keys(calendar) === 0) {
      console.log("Error: no data found in source file");
      process.exit(1);
    }

    console.log(`Info: found ${Object.keys(calendar).length} teachers`);
    console.log(`Info: found ${Object.keys(groupAndTeacherCorres).length} slots`);

    (await readXlsxFile(file, { sheet: 'Elèves' }))
      .map(row => ({
        id: row[0], 
        firstname: row[2], 
        lastname: row[1], 
        status: typeof row[3] === 'string' ? accents.remove(row[3]).toUpperCase().trim() : null, 
        slot: row[4]
      }))
      .filter(student => status.indexOf(student.status) !== -1)
      .forEach(student => {
        if (student.slot === null || typeof student.slot !== 'string') {
          return;
        }

        const slot = student.slot.toLowerCase();

        if (groupAndTeacherCorres[slot] === undefined) {
          return;
        }

        const teacher = groupAndTeacherCorres[slot];

        if (calendar[teacher] === undefined || calendar[teacher][slot] === undefined) {
          return;
        }

        calendar[groupAndTeacherCorres[slot]][slot].push({
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          status: student.status
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
          if (a.day !== b.day) {
            return days.indexOf(a.day) < days.indexOf(b.day) ? -1 : 1;
          }

          if (a.hour !== b.hour) {
            return a.hour < b.hour ? -1 : 1;
          }

          return a.minutes < b.minutes ? -1 : 1;
        });
    });

    calendar = calendar.filter(teacher => teacher.slots.length);

    if (calendar.length === 0) {
      console.log("Error: no slots/students found in source file");
      process.exit(1);
    }

    fs.writeFileSync(output, JSON.stringify(calendar)); 

    console.log(`Info: data saved to file ${output}`);

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-f, --file <file>', 'input file name')
  .option('-o, --output <output>', 'output file name')
  .parse(process.argv);

if (commander.file === undefined || commander.output === undefined) {
  console.log("Error: file and output are required");
  process.exit(1);
}

try {
  if (fs.existsSync(commander.file) === false) {
    console.log(`Error: file "${commander.file}" doesn't exists`);
    process.exit(1);
  } 
  
  main(commander.file, commander.output);
  
} catch (err) {
  console.log(err);
  process.exit(1);
}
