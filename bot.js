/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Run your bot from the command line:
    token=<MY TOKEN> node bot.js
# USE THE BOT:
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot will reply "Hello!"
  Say: "who are you?"
  The bot will tell you its name, where it running, and for how long.
  Say: "Call me <nickname>"
  Tell the bot your nickname. Now you are friends.
  Say: "who am I?"
  The bot will tell you your nickname, if it knows one for you.
  Say: "shutdown"
  The bot will ask if you are sure, and then shut itself down.
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

//var Botkit = require('botkit');
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var bios = require('./bios.js');

var controller = Botkit.slackbot({
    debug: true,
    json_file_store: 'data',
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

//If the user says "hello or hi," respond
controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot, message) {

    /*bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });*/


    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hello ' + user.name + '!!');
        } else {
            bot.reply(message,'Hello.');
        }
    });
});

//If the user says Why am I here, respond
controller.hears(['/why am i here/i','/why/i'],'direct_message,direct_mention,mention',
    function(bot, message){

    bot.startConversation(message, function(err, convo){
        convo.say('Well to start, here is a document outlining your tasks and duties here.');
        convo.say('https://docs.google.com/document/d/1l_YaOwCUN4l8C98dsZ4QtqcbwqENEinkvXiNbQDeJ5E/edit?usp=sharing');
        convo.ask('Do you have any questions about the document?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo){
                    documentQuestions(bot, response);
                    convo.repeat();
                    convo.next();
                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo){
                    convo.say('Alright, is there anything else I can help you with?');
                    convo.next();
                    convo.stop();
                }
            }
        ]);
        convo.next();
    });
    //bot.reply(message, "You are here for a number of reasons, let me explain in a minute!");
});

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var response = {
        text: matches[1],		
        user: message.user,
    };
    saveName2(response, bot, controller, message);
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',
    function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            //bot.reply(message,'I don\'t know yet!');
            getNameConvo(message);
        }
    });
});

controller.hears(['what are the company values','what','company values'],
    'direct_message,direct_mention,mention', function(bot, message){
    bot.startConversation(message, function(err, convo){
        convo.say('This is where the company will put their values');
        convo.say('Company values go here');
        convo.stop();
    });
});

/*controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});
*/

controller.hears(['uptime','identify yourself','who are you','what is your name'],
    'direct_message,direct_mention,mention',function(bot, message) {

    //TODO: Modify Who are you
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' 
        + bot.identity.name 
        + '>. I have been running for ' 
        + uptime + ' on ' + hostname + '.');
});

controller.hears(['bios','who works here?','who am i working for?'],
    ['direct_message','direct_mention','mention'],function(bot, message){
    
    bios.sendProfile(bot, message);
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime   = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}


var documentQuestions = function(bot, message){
    //Answer questions about document, in the future
    bot.reply(message,'This feature is still being developed.');
    //convo.repeat();
}


var askForName = function(bot, convo, controller){
    convo.ask('What would you like me to call you then?', function(response, convo){
        controller.storage.users.get(response.user,function(err, user) {
            if (!user) {
                user = {
                    id: response.user,
                };
            }   
            user.name = response.text;
            controller.storage.users.save(user,function(err, id) {
                convo.say('Got it. I will call you ' + user.name + ' from now on.');
            });
        });
    });
    convo.next();
}

var getNameConvo = function(message){
    bot.startPrivateConversation(message, function(err, convo){
        convo.ask('I do not know yet, would you like to tell me your name?',[ 
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo){
                    //askForName(bot, convo, controller);
                    convo.ask('What would you like me to call you?', function(response, convo){
                        savedResponse = response;
                        convo.next();
                        convo.ask('So you would like me to call you ' 
                            + savedResponse.text + '?',[
                            {
                                pattern: bot.utterances.yes,
                                callback: function(response, convo){
                                    saveName(savedResponse, convo, controller);
                                }
                            },
                            {      
                                pattern: bot.utterances.no,
                                callback: function(response, convo){
                                    convo.say('Okay, that is fine. Anything else?');
                                    convo.next();
                                }        
                            }
                        ]);
                        convo.next();
                    });
                    convo.next();
                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response, convo){
                    convo.say('Okay, that is fine. Anything else?');
                    //convo.stop();
                    convo.next();
                }
            },
            {
                default: true,
                callback: function(response, convo){
                    savedResponse = response;
                    convo.ask('So you would like me to call you ' + response.text + '?',[
                        {
                            pattern: bot.utterances.yes,
                            callback: function(response, convo){
                                saveName(savedResponse, convo, controller);
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: function(response, convo){
                                convo.say('Okay. I will not remember that.');
                                convo.next();
                                //convo.stop();
                            }
                        }
                    ]);
                    convo.next();
                }
            }
        ]);
        //convo.next();
    });
}

var saveName = function(response, convo, controller){
    convo.say('Okay, I will call you ' 
        + response.text 
        + ' from now on!');
    controller.storage.users.get(response.user, function(err, user) {
        if (!user) {
            user = {
                id: response.user,
            };
        }
        user.name = response.text;
        controller.storage.users.save(user,function(err, id) {
            convo.say('If you want to change what I call you at' 
                + ' anytime, just say \'call me\' with your new name');
            convo.next();
        });
    });
}

var saveName2 = function(response, bot, controller, message){
    bot.reply(message, 'Okay, I will call you '
        + response.text
        + ' from now on!');
    controller.storage.users.get(response.user, function(err, user){
        if(!user){
            user = {
                id: respose.user,
            }
        }
        user.name = response.text;
        controller.storage.users.save(user, function(err, id){
            bot.reply(message, 'If you want to change what I call you at' 
                + ' anytime, just say \'call me\' with your new name');
        })
    });
}
