'use strict';

var Alexa = require('alexa-sdk');

var handlers = {
  'LaunchRequest': function() {
    this.response.speak("Hello, Welcome to Food Box! What would you like to cook?").listen("What would you like to cook?");
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    var recipe = this.event.request.intent.slots.recipe.value;
    this.response.speak("You chose " + recipe);
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};