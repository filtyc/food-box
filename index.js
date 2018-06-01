'use strict';

const Alexa = require('alexa-sdk');

var handlers = {
  'LaunchRequest': function() {
    const welcomeMessage = 'Hello, Welcome to Food Box!';
    const recipeQuestion = 'What would you like to cook?';

    this.emit(':ask', `${welcomeMessage} ${recipeQuestion}`, recipeQuestion);
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    const chosenRecipe = this.event.request.intent.slots.recipe.value;

    this.emit(':tell', `You chose ${chosenRecipe}.`);
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};