# LMDSSchedulerServer
Download file
```console
node scripts/download_file.js -t 1234ABCDE -o files/data.xlsx
```

Create calendar
```console
$ node scripts/create_calendar -f files/data.xlsx -o files/calendar.json
```

Update database
```console
$ node scripts/update_db.js -f files/result.csv -o files/db.json
```

Create excel file
```console
$ node scripts/db_to_excel.js -c files/calendar.json -r files/db.json -o files/result.xlsx
```
