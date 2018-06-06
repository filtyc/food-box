'use strict';

const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const fs = require('fs');
const _ = require('lodash');

let speech = new Speech();

const handlers = {

  'LaunchRequest': function() {

    // first time user
    if (_.isEmpty(this.attributes)) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };

      speech.say(`Welcome to Food Box: an Alexa skill that can read meal kit recipes for you. `);
    }

    // returning user
    else {
      speech.say('Welcome back to Food Box! ');

      // user has a recipe opened
      if (!_.isEmpty(this.attributes.foodBox.currentRecipe)) {
        const recipe = this.attributes.foodBox.currentRecipe.name;
        const mealkit = this.attributes.foodBox.currentRecipe.mealkit;

        speech.say(`You are in the middle of cooking ${recipe} from ${mealkit}. `);
      }
    }

    this.emit('AMAZON.HelpIntent');
  },

  'ChooseRecipe': function () {
    if (this.event.request.dialogState !== 'COMPLETED') {
      this.emit(':delegate');
    } else {
      let speech = new Speech();
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };
      const recipeRequested = this.event.request.intent.slots.recipe.value;
      const mealkitRequested = this.event.request.intent.slots.mealkit.value;
      const erRecipeStatus = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].status.code;
      const erMealkitStatus = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].status.code;
      if (erMealkitStatus === 'ER_SUCCESS_NO_MATCH') {
        speech.say(`Sorry, ${mealkitRequested} is not one of the meal kit options.`);
        // TODO: list availible options
      }
      else if (erRecipeStatus === 'ER_SUCCESS_NO_MATCH') {
        speech.say(`Sorry, I couldn't find a recipe for ${recipeRequested} from ${mealkitRequested}.`)
        // TODO: list availible options
      } else {
        const resolvedRecipe = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const resolvedMealkit = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const recipes = JSON.parse(fs.readFileSync('recipes.json'));
        this.attributes.foodBox.currentRecipe = recipes[resolvedMealkit][resolvedRecipe];
        speech.say(`You chose ${resolvedRecipe} from ${resolvedMealkit}.`);
        // TODO: list ingredients
      }
      const speechOutput = speech.ssml(true);
      this.emit(':tell', speechOutput);
      this.emit(':responseReady');
    }
  },

  'Next': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    const lastIngredient = this.attributes.foodBox.currentRecipe.lastIngredient;
    const stepTotal = currentRecipe.steps.length;
    let currentStep = this.attributes.foodBox.currentStep;
    let speech = new Speech();
    if (currentStep >= stepTotal) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };
      speech.say('There are no more steps for this recipe. Goodbye!');
    } else {
      if (currentStep === 0) {
        speech.say('Grab the following ingredients: ');
      } else if (currentStep === lastIngredient + 1) {
        speech.say('Continue with the following steps: ');
      }
      speech.say(currentRecipe.steps[currentStep]);
      this.attributes.foodBox.currentStep++;
    }
    const speechOutput = speech.ssml(true);
    this.emit(':tell', speechOutput);
    this.emit(':responseReady');
  },

  'Repeat': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    let currentStep = this.attributes.foodBox.currentStep;
    if (currentStep > 0) {
      this.attributes.foodBox.currentStep--;
    }
    this.emit('Next');
  },

  'AMAZON.StopIntent': function() {
    speech.say('Goodbye!');

    this.emit(':tell', speech.ssml(true));
    speech = new Speech();
    this.emit(':responseReady');
  },

  'AMAZON.CancelIntent': function() {
    speech.say('Goodbye!');

    this.emit(':tell', speech.ssml(true));
    speech = new Speech();
    this.emit(':responseReady');
  },

  'AMAZON.HelpIntent': function () {
    speech
      .say('To start cooking, say:')
      .pause('500ms')
      .say('"Alexa, ask Food Box to start".')
      .pause('500ms')
      .say('To hear the next step, say:')
      .pause('500ms')
      .say('"Alexa, ask Food Box for next".')
      .pause('500ms')
      .say('To repeat a step, say:')
      .pause('500ms')
      .say('"Alexa, ask Food Box for last".')
      .pause('500ms')
      .say('Happy cooking!');

    this.emit(':tell', speech.ssml(true));
    speech = new Speech();
    this.emit(':responseReady');
  },

  'Unhandled': function () {
    speech.say(`Sorry, I didn't get that.`);

    this.emit('AMAZON.HelpIntent');
  },

  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  }

};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.dynamoDBTableName = 'FoodBox';
  alexa.registerHandlers(handlers);
  alexa.execute();
};