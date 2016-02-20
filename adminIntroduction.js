//var Botkit = require('botkit');
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var botToken = process.env.token;

var controller = Botkit.slackbot({
    debug: true,
});

 var bot = controller.spawn({

    token: botToken
});
bot.startRTM();

var updateGroup = function(bot,message){
     //open a direct message with new slack user
     console.log(message);
     
     //run through all user and create direct message with admin
     bot.api.users.list({}, function(err, response){
         var oldResponse = response;
         var numMembers = response.members.length;
         var ims;
         var noDMs = [];
         bot.api.im.list({}, function(err, response){
             ims = response;
             console.log(ims);
             for(var i=0; i<numMembers; i++){
             var member = oldResponse.members[i];
             if(member.is_admin){
                   

                     if(ims.ok == true){
                        var bool = false;
                        console.log(response.ims);
                        var num;
                        for(num in response.ims){
                            //console.log(response.ims[num
                            console.log(message);
                            if(response.ims[num].user == member.id){
                                console.log("here");
                                var text = '{ "channel":"' + response.ims[num].id + '",' +
                                     
                                    '"attachments":[{'+
                                        '"title":"Thank you for adding me",'+
                                        '"title_link": "https://jzinger18.typeform.com/to/NuaCJx",'+
                                        '"text": "Hello ' + member.profile.first_name +
                                        '. Click on the title to help you get started inputing company culture"'+
                                        
                                '}]}';
                                var sendMessage = JSON.parse(text);
                                bot.say(sendMessage);
                                bool = true;
                                
                            }
                        }
                        if(!bool){
                            noDMs.push(member.id);
                        }
                     }
                     else{
                         noDMs.push(member.id);
                     }

              
             }
         }
         for(var noDM in noDMs){
            bot.api.im.open({
                user: noDM,
            }, function(err, message) {
                if(err){

                }else{
                console.log(message);
                if(message.user.profile!=undefined){
                    var text =text = '{ "channel":"' + response.ims[num].id + '",' +
                                     
                                    '"attachments":[{'+
                                        '"title":"Thank you for adding me",'+
                                        '"title_link": "https://jzinger18.typeform.com/to/NuaCJx",'+
                                        '"text": "Hello ' + member.profile.first_name +
                                        '. Click on the title to help you get started inputing company culture"'+
                                        
                                '}]}';
                    var sendMessage = JSON.parse(text);
                    bot.say(sendMessage);
                }
                }
            });
         }
         });

     });

 };
controller.on('bot_added', updateGroup);
//controller.on('user_typing', updateGroup); 