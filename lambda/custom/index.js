'use strict';

const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const fs = require('fs');
const _ = require('lodash');

const HELP_MESSAGE = 'To start cooking you can say "Alexa, ask Food Box to read me a recipe". If you change your mind say "Alexa, tell Food Box to switch recipes" at any point. Once the recipe has been selected, continue with "Alexa, ask Food Box for next step" and "Alexa, tell Food Box to repeat the last  step" until you are finished. Happy cooking!'
const FIRST_WELCOME_MESSAGE = `Welcome to Food Box: an Alexa skill that can read meal kit recipes for you. ${HELP_MESSAGE}`;
const REGULAR_WELCOME_MESSAGE = 'Welcome back to Food Box!';
const HELP_OFFER = 'Say "Alexa, ask Food Box for help" to hear a full reminder on how to use this skill.'

const handlers = {
  'LaunchRequest': function() {
    let speech = new Speech();
    // first time user
    if (_.isEmpty(this.attributes)) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };
      speech.say(FIRST_WELCOME_MESSAGE);
    }
    // returning user with an open recipe
    else if (!_.isEmpty(this.attributes.foodBox.currentRecipe)) {
      const recipe = this.attributes.foodBox.currentRecipe.fullName;
      const mealkit = this.attributes.foodBox.currentRecipe.mealkit;
      speech.say(`${REGULAR_WELCOME_MESSAGE} You are in the middle of cooking ${recipe} from ${mealkit}. ${HELP_OFFER}`);
    }
    // returning user with no open recipe
    else {
      speech.say(`${REGULAR_WELCOME_MESSAGE} You don\'t have an open recipe. ${HELP_OFFER}`);
    }
    const speechOutput = speech.ssml(true);
    this.emit(':tell', speechOutput);
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    if (this.event.request.dialogState !== 'COMPLETED') {
      this.emit(':delegate');
    } else {
      let speech = new Speech();
      // TODO: confirm change in recipe if one was ongoing
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
        // can this be done with dots?
        this.attributes.foodBox.currentRecipe = recipes[resolvedMealkit][resolvedRecipe];
        speech.say(`You chose ${resolvedRecipe} from ${resolvedMealkit}.`);
      }
      const speechOutput = speech.ssml(true);
      this.emit(':ask', speechOutput);
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
    this.emit(':ask', speechOutput);
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
    this.emit(':tell', 'Goodbye!');
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye!');
    this.emit(':responseReady');
  },
  'AMAZON.HelpIntent': function () {
    this.emit(':tell', HELP_MESSAGE);
    this.emit(':responseReady');
  },
  'Unhandled': function () {
    this.emit(':tell', `Sorry, I didn't get that.`);
    this.emit(':responseReady');
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