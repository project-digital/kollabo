/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack Button application that adds a bot to one or many slack teams.
# RUN THE APP:
  Create a Slack app. Make sure to configure the bot user!
    -> https://api.slack.com/applications/new
  Run your bot from the command line:
    clientId=<my client id> clientSecret=<my client secret> port=3000 node slackbutton_bot.js
# USE THE APP
  Add the app to your Slack by visiting the login page:
    -> http://localhost:3000/login
  After you've added the app, try talking to your bot!
# EXTEND THE APP:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');
////var app = require('express')();
var bodyParser = require('body-parser');
var upload = require('multer')();
var request = require('request');

 // Decdie which db to access. 
 // First try corresponding Heroku Pipeline stage (deve or prod)
 // Second if testing locally, connect to mongo localhost
var mongo_url = process.env.MONGOLAB_URI || "mongodb://localhost:27017"

// Botkit-based Mongo store
var botkit_storage_mongo = require("./lib/botkit-storage-mongo")({mongoUri: mongo_url});

////app.use(bodyParser.json()); // for parsing application/json
////app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Programmatically use appropriate process environment variables
// Must have a  "env.js" locally that is untracked by git (aka in .gitignore)
// Secure tokens, do not commit, do not publicize, keep local.
try {
  require('./env.js');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('Not using environment variables from env.js');
  }
}

// Use port requested by server or for local testing as specificed in env.js
var port = process.env.PORT || process.env.port;


if (!process.env.clientId || !process.env.clientSecret || !port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


// Start Bot
var controller = Botkit.slackbot({
  //json_file_store: './db_slackbutton_bot/',
  debug: true,
  storage: botkit_storage_mongo
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
  }
);

// Start web server, and display Slack App Page
controller.setupWebserver(port,function(err,webserver) {
  
  webserver.get('/',function(req,res) {
    res.sendFile('index.html', {root: __dirname});
  });
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
          convo.say('Thank you for installing Kollabo, To get started help me learn a little about yoru Slack team, and what you stand for! This Quick form gives me the basics to start learning : )');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});

controller.hears('hello','direct_message',function(bot,message) {
  bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
});


// Default included code causes bot to crash.
/*
controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err) {
    if (err) { console.log(err) }
    bot.reply(message,'I heard you loud and clear boss.');
  });
});
*/

controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      var bot = controller.spawn(teams[t]).startRTM(function(err) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});

/*
////Commenting out second server for now.
app.listen(port);

//Webhook logic
app.post('/', upload.array(), function (req, res, next) {
  	//console.log(req.body);
  	res.send(req.body.TeamID);
  	var webhookUrl;
  	var teamData;
  	controller.storage.teams.get(req.body.TeamID, function(err, team_data){
  		//console.log(team_data.incoming_webhook.url);
  		webhookUrl = team_data.incoming_webhook.url;
  		teamData = team_data;
  		if(webhookUrl != null && webhookUrl != undefined){
  			sendWebhook(webhookUrl, req, teamData);
  		}
  	});
  	/*teams.findOne({ID:req.body.TeamID}).on('success', function(doc){
		webhookUrl = doc.incoming_webhook.url;
  	});
  	
  	return;
});

*/

/*
//This is the code to send (post) the webhook to the slack api.
var sendWebhook = function(url, req, data){
	console.log(url);
	var options;
	var name = controller.storage.users.get(data.incoming_webhook.createdBy,function(err, user_data){
		console.log(user_data);
		options = {
  			uri: url,
  			method: 'POST',
  			json: {
    			"Inception": req.body.Inception,
	    		"Industry" : req.body.Industry,
    			"CompanyName" : req.body.CompanyName,
    			"TeamID" : req.body.TeamID,
    			"_ID" : req.body._ID,
    			"attachments" : [
    				{
    					"fallback" : "Thank you!",
    					"color" : "#11ff99", 
    					"text" : "Hey " + 
    					user_data.user +
    					", thank you for filling out the form. I will use this info when new users join." +
    					"\nHave a wonderful day, and we will be talking soon!",
    					"author_name" : "Kollabo"
    				}
    			]
    	  	}
 		};
 		console.log("url: " + url);
		request(options, function(error, response, body){
			if(!error && response.statusCode == 200){
				console.log(body);
			}
			else if(error){
				console.log(error);
			}
		});
 	});
	
	
	/*request.post(url, {
	
		"Inception" : req.body.Inception,
		"Industry" : req.body.Industry,
		"CompanyName" : req.body.CompanyName,
		"TeamID" : req.body.TeamID,
		"_ID" : req.body._ID,
		"text" : req.body.text
		
	}, function(error, response, body){
		if(!error && response.statusCode == 200){
			console.log(body);
		}
		else if(error){
			console.log(error);
		}
	});
	
	
}
*/