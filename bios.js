module.exports = {
	sendProfile : function(bot, message){
    
    	var text = '{' +
  			'"attachments": [{' +
  				'"fallback": "Test Profile",' +
	  			'"color" : "good",' +
  				'"pretext" : "Here is a test profile",' +
  				'"author_name" : "John Doe: CEO",' +
  				'"author_link" : "https://en.wikipedia.org/wiki/John_Doe",' +
  				'"author_icon" : "https://upload.wikimedia.org/wikipedia/commons/b/b0/Information_icon_ff.png",' +
//  				'"fields": [{' +
//  				'"title" : "John Doe",' +
//  				'"value" : "CEO",' +
//  				'"short" : false' +
//  				'}],' + 
  				'"text" : "' +
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi pulvinar accumsan elit, ut rhoncus ex tincidunt vehicula. Aliquam metus dolor, aliquet vitae lacinia ac, finibus ut nisi. Aliquam dolor libero, aliquam sed cursus ultricies, porta vitae sapien. Vestibulum lacinia iaculis enim in finibus. Vestibulum eleifend mauris id maximus imperdiet. Ut lacus orci, dapibus eu cursus viverra, euismod porta arcu. Sed pharetra eros mi, at convallis orci tristique ut. Donec pulvinar urna commodo mauris dictum sollicitudin. Suspendisse potenti. Vestibulum euismod ligula vel ipsum vehicula dictum. Donec iaculis vulputate libero, et laoreet dui venenatis at.",' +
				'"image_url" : "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/John_Doe,_born_John_Nommensen_Duchac.jpg/348px-John_Doe,_born_John_Nommensen_Duchac.jpg"'+
  			'} ]}';
  		var reply = JSON.parse(text);
	  	//console.log(reply);
	  	bot.reply(message, reply);
	}
};

