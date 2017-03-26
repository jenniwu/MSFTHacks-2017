var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var intents = new builder.IntentDialog();
//bot.dialog('/', intents);


//=========================================================
// Bots Dialogs
//=========================================================

// bot.dialog('/', function (session) {
//     session.send("Hello World");
//     session.send("Bye :P");
// });

var diet;
var allergy;


bot.dialog('/', [
    function (session) {
        session.beginDialog('/askItem');
    },
    function (session, results) {
        session.send('You entered ' + session.message.text + '.', results.response.text);
        session.beginDialog('/askDiet');
    }
]);
bot.dialog('/askItem', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What\'s in your grocery basket?');
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/askDiet', [
    function (session) {
        builder.Prompts.text(session, 'Do you have any dietary restrictions?');
    },
    function (session, results) {
        diet = response;
        session.endDialogWithResult(results);
    }
]);



// bot.dialog('/', [
//     function (session) {
//         session.beginDialog('/askName');
//     }

// ]);
// bot.dialog('/askItem', [
//     function (session) {
//         builder.Prompts.text(session, 'Hi! What is in your grocery basket?');
//     },
//     function (session, results) {
//         session.send("You mentioned " + results.text);
//         session.endDialogWithResult(results);
//     }

// ]);

// var intents = new builder.IntentDialog();
// bot.dialog('/askDiet', intents);

// intents.matches(/^echo/i, [
//     function (session) {
//         builder.Prompts.text(session, "Do you have any dietary restrictions?");
//     },
//     function (session, results) {
//         diet = session.message.text;
//         session.send("Ok... %s", results.response);
//     }
// ]);

