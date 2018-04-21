#!/usr/bin/env node

var fs = require('fs');
var moment = require('moment-timezone');

function normalize(entry) {
	for (var key in entry) {
		var value = entry[key];
		switch (key) {
			case 'timestamp':
				// timestamp format: 4/1/11 11:00:00 AM
				var eastern = moment(value, 'MM/DD/YY hh:mm:ss A').tz('America/New_York');
				entry[key] = eastern.toISOString(true); // prevent utc conversion with bool true
				break;
			case 'zipcode':
				if (value.length < 5) {
					var number = 5 - value.length;
					var padding = '';
					for (var i = 0; i < number; i++) {
						padding += '0';
					}
					entry[key] = padding + value;
				}
				break;
			case 'fullName':
				entry[key] = value.toUpperCase();
				break;
			case 'fooDuration':
			case 'barDuration':
				// convert them to a floating point seconds format.
				break;
			case 'totalDuration':
				var foo = moment(entry.fooDuration, 'hh:mm:ss.SSS');
				var bar = moment.duration(entry.barDuration);
				var foobar = foo.add(bar);
				entry[key] = foobar.format('hh:mm:ss.SSS');
		}
	}
};

// line -- 0: Timestamp,1: Address,2: ZIP,3: FullName,4: FooDuration,5: BarDuration,6: TotalDuration,7: Notes
// 4/1/11 11:00:00 AM,"123 4th St, Anywhere, AA",94121,Monkey Alberto,1:23:32.123,1:32:33.123,zzsasdfa,I am the very model of a modern major general
function processCSVLine(line) {
	var lineArr = line.split('"');
	var entry;

	// quotation marks are not present
	if (lineArr.length === 1) {
		lineArr = line.split(',');
		entry = {
			timestamp: lineArr[0],
			address: lineArr[1],
			zipcode: lineArr[2],
			fullName: lineArr[3],
			fooDuration: lineArr[4],
			barDuration: lineArr[5],
			totalDuration: lineArr[6],
			notes: lineArr[7]
		}
		return entry;
	}

	/* 
		using the max length of timestamp to determine whether data 
		with quotation marks is in address column or notes
	*/
	if (lineArr[0].length <= 21) {
		var partLineArr = lineArr[2].split(',');
		entry = {
			timestamp: lineArr[0].slice(0, -1), // remove ending comma
			address: lineArr[1],
			zipcode: partLineArr[1],
			fullName: partLineArr[2],
			fooDuration: partLineArr[3],
			barDuration: partLineArr[4],
			totalDuration: partLineArr[5],
			notes: partLineArr[6]
		}
		return entry;
	}

	var partLineArr = lineArr[0].split(',');
	entry = {
		timestamp: partLineArr[0],
		address: partLineArr[1],
		zipcode: partLineArr[2],
		fullName: partLineArr[3],
		fooDuration: partLineArr[4],
		barDuration: partLineArr[5],
		totalDuration: partLineArr[6],
		notes: lineArr[1]
	}

	return entry;
}

function getCSVInput(CSVFilename, cb) {
	// adding column names as first line
	var CSVData = 'Timestamp,Address,ZIP,FullName,FooDuration,BarDuration,TotalDuration,Notes\n';

	fs.readFile(CSVFilename, 'utf8', function(err, data) {
		if (err) {
			return cb(err);
		}

		var dataArr = data.split('\n');
		dataArr.forEach(function(line, i) {
			if (line && i) {
				// splitting on quotation mark to get full address
				entry = processCSVLine(line);
				normalize(entry);
				var CSVLine = createCSVLine(entry);
				CSVData += (CSVLine + '\n');
			}
		});

		var newFilename = 'normalized-' + CSVFilename;
		fs.writeFile(newFilename, CSVData, 'utf8', function(err) {
			if (err) {
				return cb(err);
			}
			return cb(null, newFilename);
		});
	});
};

function createCSVLine(entry) {
	var line = '';
	for (var key in entry) {
		line += (entry[key] + ',');
	}
	line = line.slice(0, -1); // remove trailing comma
	return line;
};

function main() {
	// process.argv -- 0: node, 1: filename, 2: input
	var CSVFilename = process.argv[2];

	getCSVInput(CSVFilename, function(err, newFilename) {
		if (err) {
			console.error(err.message);
			process.exit(1);
		}

		console.log('Created normalized csv: ' + newFilename);
	});
};

main();
