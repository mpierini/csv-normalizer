# csv-normalizer
This tool was built to be run on Ubuntu 16.04 LTS using Node.js on v9.2.1 and npm 5.5.1

This command will install necessary packages and make sure that the tool's binary name can be used.
`sudo npm install -g`

Example usage:
`csv-normalizer <filename>`

The tool works with `<filename>` located in the current working directory and only when the file is in csv format.

If it has succeeded, the program will output the filename of the normalized csv file that was written to the cwd.
