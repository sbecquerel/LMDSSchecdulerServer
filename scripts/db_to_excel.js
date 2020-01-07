const fs = require('fs');
const xl = require('excel4node');
const moment = require('moment');
const commander = require('commander');

const getWeeksInYear = (year) => {
  let day = 31;
  
  while (1) {
    const weekNumber = moment(`${year}-12-${day}`, 'YYYY-MM-DD').week();
    
    if (weekNumber !== 1) {
      return weekNumber;
    }
    day--;
  }
}

const getBoundaries = (result) => {
  return result.reduce((currentBoundaries, student) => {

    Object.keys(student.year).forEach(key => {
      const minWeek = Math.min(...student.year[key]);
      const maxWeek = Math.max(...student.year[key]);
      const year = parseInt(key);

      if (year < currentBoundaries.min.year) {
        currentBoundaries.min.year = parseInt(year);
        currentBoundaries.min.week = minWeek;
      } else if (year === currentBoundaries.min.year && minWeek < currentBoundaries.min.week) {
        currentBoundaries.min.week = minWeek;
      }

      if (year > currentBoundaries.max.year) {
        currentBoundaries.max.year = parseInt(year);
        currentBoundaries.max.week = maxWeek;
      } else if (year === currentBoundaries.max.year && maxWeek > currentBoundaries.max.week) {
        currentBoundaries.max.week = maxWeek;
      }
    });

    return currentBoundaries;
  }, {
    min: {year: moment().year(), week: moment().week()},
    max: {year: moment().year(), week: moment().week()}
  });
}

const createHeader = (ws, boundaries) => {  
  const indexSaving = {};
  let index = 6;

  for (let year = boundaries.min.year; year <= boundaries.max.year; year++) {
    ws.cell(1, index).number(year).style({font: {bold: true}});

    let startWeek = boundaries.min.year === year ? boundaries.min.week : 1;
    let maxWeek = boundaries.max.year === year ? boundaries.max.week : getWeeksInYear(year);
    
    for (let week = startWeek; week <= maxWeek; week++) {      
      ws.cell(2, index).number(week).style({
        font: {
          bold: true
        }
      });

      if (indexSaving[year] === undefined) {
        indexSaving[year] = {};
      }
      indexSaving[year][week] = index;
      index++;
    }
  }

  return indexSaving;
}

const createStudentList = (calendar) => {
  const studentList = {};

  calendar.forEach(teacher => 
    teacher.slots.forEach(slot =>
      slot.students.forEach(student => 
        studentList[student.id] = {
          ...student, 
          day: slot.day,
          hour: slot.hour,
          minutes: slot.minutes,
          teacher_name: teacher.name
        }
      )
    )
  );

  // @todo: trier??
  return Object.values(studentList)/*.sort((a, b) => a.id < b.id)*/;
}

const findClassStudentsFromStudent = (calendar, studentId) => {
  for (let i = 0; i < calendar.length; i++) {
    const teacher = calendar[i];

    for (let j = 0; j < teacher.slots.length; j++) {       
      const students = teacher.slots[j].students;
      
      if (students.find(student => student.id === studentId) !== undefined) {
        return students.filter(student => student.id !== studentId).map(student => student.id);
      }
    }
  }
  
  return [];
}

const studentSetForWeek = (result, studentId, year, week) => {
  const student = result.find(student => student.id === studentId);
  
  if (student !== undefined
    && student.year[year] !== undefined
    && student.year[year].indexOf(week) !== -1
  ) {
    return true;
  }

  return false;
}

const main = async (calendar, result, outputFile) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Présence');
  const boundaries = getBoundaries(result);

  result.sort((a, b) => a.id < b.id ? -1 : 1);
 
  const indexSaving = createHeader(ws, boundaries);
  
  ws.cell(2, 1).string('ID').style({font: {bold: true}});
  ws.cell(2, 2).string('Nom').style({font: {bold: true}});
  ws.cell(2, 3).string('Statut').style({font: {bold: true}});
  ws.cell(2, 4).string('Prof').style({font: {bold: true}});
  ws.cell(2, 5).string('Créneau').style({font: {bold: true}});

  ws.column(2).setWidth(30);
  ws.column(5).setWidth(15);
  
  let row = 3;

  const studentList = createStudentList(calendar);

  studentList.forEach(student => {
    ws.cell(row, 1).number(student.id);
    ws.cell(row, 2).string(`${student.firstname} ${student.lastname}`);
    ws.cell(row, 3).string(student.status);
    ws.cell(row, 4).string(student.teacher_name);
    ws.cell(row, 5).string(
      `${student.day} ${student.hour}h` + (student.minutes ? student.minutes : '')
    );

    const studentResult = result.find(currentResult => currentResult.id === student.id);

    if (studentResult !== undefined) {
      const classStudents = findClassStudentsFromStudent(calendar, studentResult.id);

      Object.keys(indexSaving).forEach(year => {
        Object.keys(indexSaving[year]).forEach(week => {
          if (studentResult.year[year] !== undefined && studentResult.year[year].indexOf(Number(week)) !== -1) {
            ws.cell(row, indexSaving[year][week]).number(1);
          } else if (classStudents.find(studentId => studentSetForWeek(result, studentId, year, Number(week))) !== undefined) {
            ws.cell(row, indexSaving[year][week]).number(0);
          }
        });
      });
    }    

    row++;
  });

  wb.write(outputFile);

  console.log(`Info: Excel file saved to ${outputFile}`);
}

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-c, --calendar <calendar>', 'calendar file name')
  .option('-r, --result <result>', 'result file name')
  .option('-o, --output <output>', 'output file name')
  .parse(process.argv);

if (commander.calendar === undefined 
  || commander.result === undefined
  || commander.output === undefined
  
) {
  console.log("Error: file, result and output are required");
  process.exit(1);
}

try {
  if (fs.existsSync(commander.calendar) === false) {
    console.log(`Error: calendar "${commander.calendar}" doesn't exists`);
    process.exit(1);
  }

  if (fs.existsSync(commander.result) === false) {
    console.log(`Error: result "${commander.result}" doesn't exists`);
    process.exit(1);
  }
  
  main(
    JSON.parse(fs.readFileSync(commander.calendar)), 
    JSON.parse(fs.readFileSync(commander.result)),
    commander.output
  );
  
} catch (err) {
  console.log(err);
  process.exit(1);
}
