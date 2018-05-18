// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');

var app = express();
app.use(
	bodyParser.urlencoded({
		extended: false
	})
);

app.use(bodyParser.json());

app.listen(process.env.PORT || 3000, function() {
	console.log(
		'Express server listening on port %d in %s mode',
		this.address().port,
		app.settings.env
	);
});

app.get('/', function(req, res) {
	res.json({ fulfillmentText: 'This is a text response' });
});

mongoose.Promise = global.Promise;

const JokeSchema = mongoose.Schema(
	{
		text: String,
		categories: []
	},
	{ collection: 'jokes' }
);

var Jokes = mongoose.model('jokes', JokeSchema);

mongoose
	.connect('mongodb://nafhta:redneural0336@ds131329.mlab.com:31329/aircache')
	.then(() => {
		console.log('Successfully connected to the database');
	})
	.catch(err => {
		console.log(err);
		console.log('Could not connect to the database. Exiting now...');
		process.exit();
	});

app.post('/webhook', function(request, res) {
	//console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	//console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	res.setHeader('Content-Type', 'application/json');
	var intent = request.body.queryResult.intent.displayName;
	var jokeabout = request.body.queryResult.parameters.jokeabout;

	if (intent == 'tellmeajokeabout') {
		if (jokeabout == '') {
			GetRandomJoke(function(joketext) {
				var jsonResponse = { fulfillmentText: "creo que no tengo chistes de eso pero aca va otro \n\n" +  joketext };
				res.json(jsonResponse);
			});
		} else {
			GetJokeAbout(jokeabout, function(joke) {
				if (joke == null || joke == '') {
					res.json({
						fulfillmentText:
							'Lo siento creo que no tengo chistes sobre ' + jokeabout
					});
				}

				res.json({ fulfillmentText: joke });
			});
		}
	}

	if (intent == 'tellmeajoke') {
    GetJokeAbout(jokeabout, function(joke) {
				if (joke == null || joke == '') {
					res.json({
						fulfillmentText:
							'Lo siento creo que no tengo chistes sobre ' + jokeabout
					});
				}

				res.json({ fulfillmentText: joke });
			});
	}
});

function GetJokeAbout(joke, callback) {
	console.log('JOKEABOUT' + joke);
	Jokes.findOne(
		{ text: { $regex: '.*' + joke + '.*', $options: 'i' } },
		function(err, joke) {
			console.log(joke);
			callback(joke.text);
		}
	);
}

function GetRandomJoke(callback) {
	Jokes.count().exec(function(err, count) {
		var random = Math.floor(Math.random() * count);
		console.log('random ' + random);
		Jokes.findOne()
			.skip(random)
			.exec(function(err, result) {
				return callback(result.text);
			});
	});
}
