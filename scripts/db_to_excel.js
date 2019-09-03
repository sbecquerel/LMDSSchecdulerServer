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
  let index = 3;

  for (let year = boundaries.min.year; year <= boundaries.max.year; year++) {
    ws.cell(1, index).number(year).style({
      font: {
        bold: true
      }
    });

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
        studentList[student.id] = student
      )
    )
  );

  // @todo: trier??
  return Object.values(studentList)/*.sort((a, b) => a.id < b.id)*/;
}

const main = async (calendar, result, outputFile) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Présence');
  const boundaries = getBoundaries(result);

  result.sort((a, b) => a.id < b.id ? -1 : 1);
 
  const indexSaving = createHeader(ws, boundaries);
  
  ws.cell(2, 1).string('id');
  ws.cell(2, 2).string('nom');
  ws.cell(2, 1, 2, 2).style({
    font: {
      bold: true
    }
  });

  ws.column(2).setWidth(30);
  
  let row = 3;

  const studentList = createStudentList(calendar);

  studentList.forEach(student => {
    ws.cell(row, 1).number(student.id);
    ws.cell(row, 2).string(`${student.firstname} ${student.lastname}`);

    const studentResult = result.find(currentResult => currentResult.id === student.id);

    if (studentResult !== undefined) {
      Object.keys(studentResult.year).forEach(year => {
        studentResult.year[year].forEach(week => {
          ws.cell(row, indexSaving[year][week]).number(1);
        })
      }) 
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
