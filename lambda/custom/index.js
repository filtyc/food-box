'use strict';

const Alexa = require('alexa-sdk');
const fs = require('fs');
const _ = require('lodash');

const HELP_MESSAGE = 'To start cooking you can say "Alexa, ask Food Box to read me a recipe". If you change your mind say "Alexa, tell Food Box to switch recipes" at any point. Once the recipe has been selected, continue with "Alexa, ask Food Box for next step" and "Alexa, tell Food Box to repeat the last  step" until you are finished. Happy cooking!'
const FIRST_WELCOME_MESSAGE = `Welcome to Food Box: an Alexa skill that can read meal kit recipes for you. ${HELP_MESSAGE}`;
const REGULAR_WELCOME_MESSAGE = 'Welcome back to Food Box!';
const HELP_OFFER = 'Say "Alexa, ask Food Box for help" to hear a full reminder on how to use this skill.'

const handlers = {
  'LaunchRequest': function() {
    // first time user
    if (_.isEmpty(this.attributes)) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };
      this.emit(':tell', FIRST_WELCOME_MESSAGE);
      this.emit(':responseReady');
    }
    // returning user with an open recipe
    else if (!_.isEmpty(this.attributes.foodBox.currentRecipe)) {
      const recipe = this.attributes.foodBox.currentRecipe.fullName;
      const mealkit = this.attributes.foodBox.currentRecipe.mealkit;
      const output = `${REGULAR_WELCOME_MESSAGE} You are in the middle of cooking ${recipe} from ${mealkit}. ${HELP_OFFER}`;
      this.emit(':tell', output);
      this.emit(':responseReady');
    }
    // returning user with no open recipe
    else {
      const output = `${REGULAR_WELCOME_MESSAGE} You don\'t have an open recipe. ${HELP_OFFER}`;
      this.emit(':tell', output);
      this.emit(':responseReady');
    }
  },
  'ChooseRecipe': function () {
    if (this.event.request.dialogState !== 'COMPLETED') {
      this.emit(':delegate');
    } else {
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
        this.emit(':tell', `Sorry, ${mealkitRequested} is not one of the meal kit options.`);
        // TODO: list availible options
        this.emit(':responseReady');
      }
      else if (erRecipeStatus === 'ER_SUCCESS_NO_MATCH') {
        this.emit(':tell', `Sorry, I couldn't find a recipe for ${recipeRequested}.`);
        // TODO: list availible options
        this.emit(':responseReady');
      } else {
        const resolvedRecipe = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const resolvedMealkit = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const recipes = JSON.parse(fs.readFileSync('recipes.json'));
        // can this be done with dots?
        this.attributes.foodBox.currentRecipe = recipes[resolvedMealkit][resolvedRecipe];
        // TODO: move this to next and get rid of promptQueue
        this.emit(':tell', `You chose ${resolvedRecipe} from ${resolvedMealkit}.`);
        this.emit(':responseReady');
      }
    }
  },
  'Next': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    const lastIngredient = this.attributes.foodBox.currentRecipe.lastIngredient;
    const stepTotal = currentRecipe.steps.length;
    let currentStep = this.attributes.foodBox.currentStep;
    let output = '';

    if (currentStep >= stepTotal) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentStep': 0
      };
      this.emit(':tell', 'There are no more steps for this recipe. Goodbye!');
      this.emit(':responseReady');
    } else {
      if (currentStep === 0) {
        output = 'Grab the following ingredients: ';
      } else if (currentStep === lastIngredient + 1) {
        output = 'Continue with the following steps: ';
      }
      output += currentRecipe.steps[currentStep];
      this.attributes.foodBox.currentStep++;
      this.emit(':tell', output);
      this.emit(':responseReady');
    }
  },
  'Repeat': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    let currentStep = this.attributes.foodBox.currentStep;
    if (currentStep > 0) {
      this.attributes.foodBox.currentStep--;
    }
    this.emitWithState('Next');
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
    this.emit(':tell', 'Sorry, I didn\'t get that.');
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