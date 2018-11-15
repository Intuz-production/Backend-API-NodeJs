var config = {
	host: 'localhost', // Database host ip
	user: 'root', // Database username
	password: 'pass', // Database password
	database: 'nodebackend', //database name
	multipleStatements: true, // allow multiple query execution at a time
	whichdb: "LOCAL" // which db it is i.e. local-live-staging
};

module.exports = config;
