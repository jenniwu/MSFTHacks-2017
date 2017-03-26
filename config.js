var config = {}

config.endpoint = "https://reciperdatabase.documents.azure.com:443/";
config.primaryKey = "Ap5syFcsVBmHYxV4BLV3OOQ5ikEPrgrj0rG1wfXS3ITt3Qn4KsI1FysSXB2Yl2Q1XvfgOtokw8gZjkW9ouC2rw==";

config.database = {
    "id": "reciperdatabase"
};

config.collection = {
    "id": "Users"
};

config.documents = {
    "userid": {
        "name": "Name",
        "lastName": "LastName",
        "favorites": [{
            "recipeTitle": "someURL"
        }, {
            "recipeTitle": "someURL",
        }]
    },
    "anotheruserid": {
        "name": "Name",
        "lastName": "LastName",
        "favorites": [{
            "recipeTitle": "someURL"
        }, {
            "recipeTitle": "someURL",
        }]
    },
};

// exporting object for reference in app.js
module.exports = config;