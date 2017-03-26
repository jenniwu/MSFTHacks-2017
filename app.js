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
var url = require('url');

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

var moreItems = true;

var cuisine = "";

bot.dialog('/', [
    function (session) {
        session.beginDialog('/askItem');
    },
    // function (session) {
    // //    while (moreItems == true) {
    //         session.beginDialog('/anymoreItems');
    // //    }   
    // },
     function (session, results) {
        session.beginDialog('/askDiet');
    },
    function (session, results) {
        session.beginDialog('/askAllergy');
    },
    function (session, results) {
        session.beginDialog('/getRecipe');
    },
   function (session, results) {
      session.beginDialong('/getRecipe2');
]);

bot.dialog('/askItem', [
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

// bot.dialog('/anymoreItems', [
//     function (session) {
//         builder.Prompts.attachment(session, 'Any more ingredients? (yes or no)');
//     },
//     function (session) {
//             if (session.message.text == "no") {
//                 anymoreItems = false;
//                 session.endDialog();
//             } else {
//                 session.beginDialog('/askMoreItems');
//                 session.endDialog();
//             }
//     }
// ]);

// bot.dialog('/askMoreItems', [
//     function (session) {
//      //   session.send('Upload another image and I\'ll build a recipe for you.');
//         builder.Prompts.attachment(session, 'Upload another image and I\'ll build a recipe for you.');
//     },
//     function(session) {
//         if (hasImageAttachment(session)) {
//         var stream = getImageStreamFromMessage(session.message);
//         captionService
//             .getCaptionFromStream(stream)
//             .then(function (caption) { 
//                 handleSuccessResponse(session, caption); 
//             })
//             .catch(function (error) { handleErrorResponse(session, error); });

//         } else {
//             session.send("did we get here");
//             var imageUrl = parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null);
//             if (imageUrl) {
//                 captionService
//                     .getCaptionFromUrl(imageUrl)
//                     .then(function (caption) { handleSuccessResponse(session, caption); })
//                     .catch(function (error) { handleErrorResponse(session, error); });
//             } else {
//                 session.send('Did you upload an image? I\'m more of a visual person. Try sending me an image or an image URL');
//             }
//         }
//     },
//     function (session, results) {
//         session.endDialogWithResult(results);
//     }
// ]);

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
        session.send('I think you sent me a picture of ' + caption + ". Great choice!");
        ingredient = caption;
   //     session.userData.food = caption;
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
        builder.Prompts.choice(session, 'Do you have any allergies or intolerances?', "No|Dairy|Gluten|Peanut|Shellfish|Seafood");
    },
    function (session, results) {
        allergy = session.message.text.toLowerCase();
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/getRecipe', [
  function (session) {
    var response = unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/searchComplex?diet=" + diet + "&includeIngredients=" + ingredient + "&intolerances=" + allergy + "&number=5")
    .header("X-Mashape-Key", "olRjJXA5jsmshyCJwsq8lloLSuAFp13iRe1jsnWSQSUzteNyRT")
    .header("Accept", "application/json")
    .end(function (result){
        // console.log(result.body.results);
        // var title = result.body.results[0]["title"].split(" ").join("-");
        // var id = result.body.results[0]["id"].toString();
        // session.send("https://spoonacular.com/" + title + "-" + id);
        var str = JSON.stringify(result.body.results).split(",");
    
    var buttons = [];
    var imgs= [];
    
    for (i = 0; i < str.length; i++) { 
         if (str[i].includes("id")) {
            var id = str[i].split(":")[1].toString();
            
        }
        if (str[i].includes("title")) {
            var title = str[i].split(":")[1].split(" ").join("-").replace(/["]/g, "");
            var out = "https://spoonacular.com/"+title+"-"+id
            buttons.push(builder.CardAction.openUrl(session, out, title.replace(/[-]/g, " ")));
            imgs.push(builder.CardImage.create(session, 'https://spoonacular.com/recipeImages/'+id+'-240x150.jpg'));
        }  
    }

        var card = new builder.HeroCard(session)
        .text('Spoonalicious choices')
        .buttons(buttons)
        .images(imgs);

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        builder.Prompts.choice(session, 'Would you like to try one of those recipes?', "Yes|No");
    })}
    , function (session, results) {
        if(session.message.text == "No"){
            session.send("Sorry we haven't found anything for you yet!");
            builder.Prompts.choice(session, 'What kind of food were you looking for?', "American|Chinese|Italian|Japanese|Mexican");
        } else{
            session.send("Great! Click one of the links above to get the recipe to one of these delicious dishes! Happy eating!")
        }
    }, function (session, results) {
        cuisine = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/getRecipe2', [
    function (session) {
    var response = unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/searchComplex?cuisine=" + cuisine + "&diet=" + diet + "&includeIngredients=" + ingredient + "&intolerances=" + allergy + "&number=5")
    .header("X-Mashape-Key", "olRjJXA5jsmshyCJwsq8lloLSuAFp13iRe1jsnWSQSUzteNyRT")
    .header("Accept", "application/json")
    .end(function (result){
        // console.log(result.body.results);
        // var title = result.body.results[0]["title"].split(" ").join("-");
        // var id = result.body.results[0]["id"].toString();
        // session.send("https://spoonacular.com/" + title + "-" + id);
        var str = JSON.stringify(result.body.results).split(",");
    
    var buttons = [];
    var imgs= [];
    
    for (i = 0; i < str.length; i++) { 
         if (str[i].includes("id")) {
            var id = str[i].split(":")[1].toString();
            
        }
        if (str[i].includes("title")) {
            var title = str[i].split(":")[1].split(" ").join("-").replace(/["]/g, "");
            var out = "https://spoonacular.com/"+title+"-"+id
            buttons.push(builder.CardAction.openUrl(session, out, title.replace(/[-]/g, " ")));
            imgs.push(builder.CardImage.create(session, 'https://spoonacular.com/recipeImages/'+id+'-240x150.jpg'));
        }  
    }

        var card = new builder.HeroCard(session)
        .text('Spoonalicious choices')
        .buttons(buttons)
        .images(imgs);

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
         builder.Prompts.choice(session, 'Would you like to try one of those recipes?', "Yes|No");
})},
    function(session, results) {
        if(session.message.text == "no"){
            session.send("Sorry we couldn't find anything for you! You're hard to please!");
        } else{
            session.send("Great!")
            session.send("Click one of the links above to get the recipe to one of these delicious dishes!");
            session.send("Happy eating!");
        }
    }
]);



