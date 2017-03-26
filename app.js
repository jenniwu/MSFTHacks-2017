var restify = require('restify');
var builder = require('botbuilder');
var unirest = require('unirest');

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
var diet = "";
var ingredient = "";
var allergy = "";

bot.dialog('/', [
    function (session) {
        session.beginDialog('/askItem');
    },
    function (session, results) {
        session.send('You entered ' + session.message.text + '.', results.response.text);
        session.beginDialog('/askDiet');
    },
    function (session, results) {
        session.beginDialog('/askAllergy');
    },
    function (session, results) {
        session.beginDialog('/getRecipe');
    }
]);
bot.dialog('/askItem', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What\'s in your grocery basket?');
    },
    function (session, results) {
        ingredient = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/askDiet', [
    function (session) {
        builder.Prompts.text(session, 'Do you have any dietary restrictions?');
    },
    function (session, results) {
        diet = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/askAllergy', [
    function (session) {
        builder.Prompts.text(session, 'Do you have any allergies or intolerances?');
    },
    function (session, results) {
        allergy = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/getRecipe', [
    function (session) {
    var response = unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/searchComplex?diet=" + diet + "&includeIngredients=" + ingredient + "&intolerances=" + allergy)
    .header("X-Mashape-Key", "WCA4DSnFmCmshXuAjT1RGfn4y4otp1rE9vujsn1baVic83L2xV")
    .header("Accept", "application/json")
    .end(function (result) {
    console.log(result.status, result.headers, result.body);
})}
]);

// bot.dialog('/', function (session) {
//     session.send("Hello World");
//     session.send("Hi");

//     // These code snippets use an open-source library. http://unirest.io/nodejs
//     var response = unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?fillIngredients=false&ingredients=apples%2Cflour%2Csugar&limitLicense=false&number=3&ranking=1")
//     .header("X-Mashape-Key", "WCA4DSnFmCmshXuAjT1RGfn4y4otp1rE9vujsn1baVic83L2xV")
//     .header("Accept", "application/json")
//     .end(function (result) {
//     console.log(result.status, result.headers, result.body);
// });
//  session.send(response.body);
// ]);
