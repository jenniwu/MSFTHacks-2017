/*-----------------------------------------------------------------------------
An recipe recommender bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var unirest = require('unirest');
var validUrl = require('valid-url');
var captionService = require('./caption-service');
var needle = require('needle');

// "use strict";
// var documentClient = require("documentdb").DocumentClient;
// var config = require("./config");
var url = require('url');

//=========================================================
// Database Setup
//=========================================================

// // Setup DocumentDB 
// var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

// // Create Node database
// var HttpStatusCodes = { NOTFOUND: 404 };
// var databaseUrl = `dbs/${config.database.id}`;
// var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

// // Return database if it exists, else create the database
// function getDatabase() {
//     console.log(`Getting database:\n${config.database.id}\n`);

//     return new Promise((resolve, reject) => {
//         client.readDatabase(databaseUrl, (err, result) => {
//             if (err) {
//                 if (err.code == HttpStatusCodes.NOTFOUND) {
//                     client.createDatabase(config.database, (err, created) => {
//                         if (err) reject(err)
//                         else resolve(created);
//                     });
//                 } else {
//                     reject(err);
//                 }
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

// function getCollection() {
//     console.log(`Getting collection:\n${config.collection.id}\n`);

//     return new Promise((resolve, reject) => {
//         client.readCollection(collectionUrl, (err, result) => {
//             if (err) {
//                 if (err.code == HttpStatusCodes.NOTFOUND) {
//                     client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
//                         if (err) reject(err)
//                         else resolve(created);
//                     });
//                 } else {
//                     reject(err);
//                 }
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

// function getDocument(document) {
//     let documentUrl = `${collectionUrl}/docs/${document.id}`;
//     console.log(`Getting document:\n${document.id}\n`);

//     return new Promise((resolve, reject) => {
//         client.readDocument(documentUrl, { partitionKey: document.district }, (err, result) => {
//             if (err) {
//                 if (err.code == HttpStatusCodes.NOTFOUND) {
//                     client.createDocument(collectionUrl, document, (err, created) => {
//                         if (err) reject(err)
//                         else resolve(created);
//                     });
//                 } else {
//                     reject(err);
//                 }
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// };

// function queryCollection() {
//     console.log(`Querying collection through index:\n${config.collection.id}`);

//     return new Promise((resolve, reject) => {
//         client.queryDocuments(
//             collectionUrl,
//             'SELECT VALUE r.favourites FROM root r WHERE r.id = "userid"'
//         ).toArray((err, results) => {
//             if (err) reject(err)
//             else {
//                 for (var queryResult of results) {
//                     let resultString = JSON.stringify(queryResult);
//                     console.log(`\tQuery returned ${resultString}`);
//                 }
//                 console.log();
//                 resolve(results);
//             }
//         });
//     });
// };

// function exit(message) {
//     console.log(message);
//     console.log('Press any key to exit');
//     process.stdin.setRawMode(true);
//     process.stdin.resume();
//     process.stdin.on('data', process.exit.bind(process, 0));
// }

// getDatabase()
// .then(() => getCollection())
// .then(() => getDocument(config.documents.userid))
// .then(() => getDocument(config.documents.anotheruserid))
// .then(() => queryCollection())
// .then(() => { exit(`Completed successfully`); })
// .catch((error) => { exit(`Completed with error ${JSON.stringify(error)}`) });


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
var cuisine = "";

bot.dialog('/', [
    function (session) {
        session.beginDialog('/askItem');
    },
    // function (session, results) {
    //     session.beginDialog('/getUser');
    // },
     function (session, results) {
        session.beginDialog('/askDiet');
    },
    function (session, results) {
        session.beginDialog('/askAllergy');
    },
    function (session, results) {
        session.beginDialog('/getRecipe');
    }
]);

// // Get users profile
// bot.dialog('/getUser', [
//     function (session) {
//         // Store the returned user page-scoped id (USER_ID) and page id
//         session.userData.userid = session.message.sourceEvent.sender.id;
//         session.userData.pageid = session.message.sourceEvent.recipient.id;

//         // Let the user know we are 'working'
//         session.sendTyping();
//         // Get the users profile information from FB
//         request({
//             url: 'https://graph.facebook.com/v2.6/'+ session.userData.userid +'?fields=first_name',
//             qs: { access_token: process.env.FB_PAGE_ACCESS_TOKEN },
//             method: 'GET'
//         }, function(error, response, body) {
//             if (!error && response.statusCode == 200) {
//                 // Parse the JSON returned from FB
//                 body = JSON.parse(body);
//                 // Save profile to database
//                 // session.dialogData.userId = session.userData.userid;
//                 session.dialogData.firstname = body.first_name;

//                 var userDetails = {
//                     userid: session.userData.userid,
//                     name: session.dialogData.firstname,
//                     favourites: []
//                 }

//                 getDocument(userDetails);
//             } else {
//                 console.log(error);
//                 console.log("Get user profile failed");
//             }
            
//         session.endDialog();
//         });
//     }
// ]);

bot.dialog('/askItem', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What\'s in your grocery basket? Upload an image and I\'ll find some food to make.');
    },
    function(session) {
        if (hasImageAttachment(session)) {
        var stream = getImageStreamFromMessage(session.message);
        captionService
            .getCaptionFromStream(stream)
            .then(function (caption) { 
                handleSuccessResponse(session, caption); 
            })
            .catch(function (error) { handleErrorResponse(session, error); });

        } else {
            var imageUrl = validUrl.isUri(session.message.text) ? session.message.text : null;
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
        ingredient = caption;
        session.endDialog();
    }
    else {
        session.send('I\'m sorry, I couldn\'t find this item.');
    }

}

function handleErrorResponse(session, error) {
    session.send('Oops! Something went wrong. Try again later.');
    console.error(error);
}

bot.dialog('/askDiet', [
    function (session, next) {
        builder.Prompts.choice(session, "Do you have any dietary restrictions?", "No|Vegan|Vegetarian|Paleo");
    },
    function (session, results) {
        diet = session.message.text.toLowerCase();
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/askAllergy', [
    function (session) {
        builder.Prompts.choice(session, 'Do you have any allergies or intolerances?', "Dairy|Gluten|Peanut|Shellfish|Seafood");
    },
    function (session, results) {
        allergy = session.message.text.toLowerCase();
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/getRecipe', [
    function (session) {
    var response = unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/searchComplex?diet=" + diet + "&includeIngredients=" + ingredient + "&intolerances=" + allergy + "&number=1")
    .header("X-Mashape-Key", "WCA4DSnFmCmshXuAjT1RGfn4y4otp1rE9vujsn1baVic83L2xV")
    .header("Accept", "application/json")
    .end(function (result){
        console.log(result.body.results);
        var title = result.body.results[0]["title"].split(" ").join("-");
        var id = result.body.results[0]["id"].toString();
        session.send("https://spoonacular.com/" + title + "-" + id);
    })}  
]);


