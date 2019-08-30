# LMDSSchedulerServer
Create calendar
```console
$ node scripts/create_calendar -f files/2019-08-21.xlsx -o files/calendar.json
```

Create result
```console
$ node scripts/compile_results.js -f files/result.csv -o files/result.json
```

Create 
```console
$ node scripts/result_to_excel.js -c files/calendar.json -r files/result.json -o files/result.xlsx
```
