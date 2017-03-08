var Twit   = require('twit');              // Twitter API Client
var config = require('./credentials.js');  // Twitter Credentials
var IOServer = require('socket.io');       // Client-side communication

// List of topics to track
var topics = [];    
    
// Configure the Twit object with the application credentials
var T = new Twit(config);
var filterOptions = {locations: '-180,-90,180,90', language: 'en'};
// Subscribe to the stream sample, for tweets in english    
var stream = T.stream('statuses/filter', filterOptions);

function twitOnTweet(tweet) {
    var  clientsCount = io.engine.clientsCount;
    if (clientsCount == 0)
    {
        stream.stop();
        console.log('no more clients');
    }
    
    var tweetText = tweet.text.toLowerCase();
    // Check if any of the topics is contained in the tweet text
    topics.forEach(function(topic) {
        
        if (tweetText.indexOf(topic.word) !== -1) {
            if(tweet.place !=null)
            {
                 tweet.coordinates = 
                 { "coordinates":tweet.place.bounding_box.coordinates[0][0], "type":"Point" }
            
            
            //console.log(tweet.coordinates);
            // Sends a simplified version of the tweet to the client
                topic.socket.emit('tweet', {
                id: tweet.id,
                coordinates: tweet.coordinates,
                word: topic.word
                });
            }
            else{
                
                topic.socket.emit('tweet', {
                id: tweet.id,
                coordinates: tweet.coordinates,
                word: topic.word
                });
                
            }
        }
    });
}


stream.on('tweet', twitOnTweet);

stream.on('connect', function(msg) {
    console.log('connect');
});

stream.on('connected', function(msg) {
    console.log('connected');
});

stream.on('warning', function(msg) {
    console.log('warning');
});

stream.on('disconnect', function(msg) {
    console.log('disconnect');
});

//-----------------------------

var port = (8080);
var express = require( "express" );
var app = express();
var http = require('http');
var httpServer = http.createServer(app);
var io = require('socket.io').listen(httpServer);
httpServer.listen(port);


// Displays a message at startup
console.log('Listening for connections in port ' + port);

// A clients established a connection with the server
io.on('connection', function(socket) {

    // Displays a message in the console when a client connects
    console.log('Client', socket.id, 'connected.');
    stream.start();

    // The client adds a new topic
    socket.on('add', function(topic) {
        // Adds the new topic to the topic list
        topics.push({word: topic.word.toLowerCase(), socket: socket});

        console.log('Adding the topic "' + topic.word + '"');
    });

    // If the client disconnects, we remove its topics from the list
    socket.on('disconnect', function() {
        console.log('Client ' + socket.id + ' disconnected.');
        topics = topics.filter(function(topic) {
            return topic.socket.id !== socket.id;
        });
    });
});