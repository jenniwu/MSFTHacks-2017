/*-----------------------------------------------------------------------------
An recipe recommender bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var unirest = require('unirest');
var url = require('url');
var validUrl = require('valid-url');
var captionService = require('./caption-service');
var needle = require('needle');

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

server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector);

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
        builder.Prompts.text(session, 'Hi! What\'s in your grocery basket? Upload an image and I\'ll find some food to make.');
    },
    function(session) {
        if (hasImageAttachment(session)) {
        var stream = getImageStreamFromMessage(session.message);
        captionService
            .getCaptionFromStream(stream)
            .then(function (caption) { handleSuccessResponse(session, caption); })
            .catch(function (error) { handleErrorResponse(session, error); });
        } else {
            var imageUrl = parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null);
            if (imageUrl) {
                captionService
                    .getCaptionFromUrl(imageUrl)
                    .then(function (caption) { handleSuccessResponse(session, caption); })
                    .catch(function (error) { handleErrorResponse(session, error); });
            } else {
                session.send('Did you upload an image? I\'m more of a visual person. Try sending me an image or an image URL');
            }
        }
    },
    function (session, results) {
        ingredient = session.message.text;
        session.endDialogWithResult(results);
    }
]);

function hasImageAttachment(session) {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1;
}

function getImageStreamFromMessage(message) {
    var headers = {};
    var attachment = message.attachments[0];
    // if (checkRequiresToken(message)) {
    //     // The Skype attachment URLs are secured by JwtToken,
    //     // you should set the JwtToken of your bot as the authorization header for the GET request your bot initiates to fetch the image.
    //     // https://github.com/Microsoft/BotBuilder/issues/662
    //     connector.getAccessToken(function (error, token) {
    //         var tok = token;
    //         headers['Authorization'] = 'Bearer ' + token;
    //         headers['Content-Type'] = 'application/octet-stream';

    //         return needle.get(attachment.contentUrl, { headers: headers });
    //     });
    // }

    headers['Content-Type'] = attachment.contentType;
    return needle.get(attachment.contentUrl, { headers: headers });
}

//=========================================================
// Response Handling
//=========================================================
function handleSuccessResponse(session, caption) {
    if (caption) {
        session.send('I think it\'s ' + caption);
    }
    else {
        session.send('Couldn\'t find a caption for this one');
    }

}

function handleErrorResponse(session, error) {
    session.send('Oops! Something went wrong. Try again later.');
    console.error(error);
}

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
