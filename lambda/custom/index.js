'use strict';

const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const fs = require('fs');
const _ = require('lodash');

const recipes = JSON.parse(fs.readFileSync('recipes.json'));
let speech = new Speech();

const listMealkits = () => {
  let list = '';
  for (let mealkit in recipes) {
    list += mealkit;
    list += ', ';
  }
  return list.replace(/..$/, '.');
};

const listRecipes = (mealkit) => {
  let list = '';
  for (let recipe in recipes[mealkit]) {
    list += recipe;
    list += ', ';
  }
  return list.replace(/..$/, '.');
};

const handlers = {

  'LaunchRequest': function() {

    // first time user
    if (_.isEmpty(this.attributes)) {

      // set empty session attributes
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

    // obtain mealkit and recipe from user if either is missing
    if (this.event.request.dialogState !== 'COMPLETED') {

      // elicit mealkit with a list of options
      if (!this.event.request.intent.slots.mealkit.value) {
        speech.say(`Choose one of the following meal kits: ${listMealkits()}`);
        this.emit(':elicitSlot', 'mealkit', speech.ssml(true));
        speech = new Speech();
      }

      // elicit recipe with a list of options
      else if (!this.event.request.intent.slots.recipe.value) {
        const mealkitRequested = this.event.request.intent.slots.mealkit.value;
        const erMealkitStatus = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].status.code;

        // check that a valid mealkit was provided or recipes can't be listed
        if (erMealkitStatus === 'ER_SUCCESS_MATCH') {
          const resolvedMealkit = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].values[0].value.name;

          speech.say(`Choose one of the following recipes: ${listRecipes(resolvedMealkit)}`);
          this.emit(':elicitSlot', 'recipe', speech.ssml(true));
          speech = new Speech();
        } else {
          speech.say(`Sorry, I couldn't find ${mealkitRequested}.`);
          this.emit(':tell', speech.ssml(true));
          speech = new Speech();
          this.emit(':responseReady');
        }
      }

      // confirm the intent before moving forward
      else if (this.event.request.intent.confirmationStatus === 'NONE') {
        const recipeRequested = this.event.request.intent.slots.recipe.value;
        const mealkitRequested = this.event.request.intent.slots.mealkit.value;
        const erRecipeStatus = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].status.code;

        // check that a valid recipe was provided before confirming the intent
        if (erRecipeStatus === 'ER_SUCCESS_MATCH') {
          const resolvedMealkit = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].values[0].value.name;
          const resolvedRecipe = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].values[0].value.name;

          speech.say(`So, you are cooking ${resolvedRecipe} from ${resolvedMealkit}. Correct?`);
          this.emit(':confirmIntent', speech.ssml(true))
          speech = new Speech();
        } else {
          speech.say(`Sorry, I couldn't find ${recipeRequested} from ${mealkitRequested}.`);
          this.emit(':tell', speech.ssml(true));
          speech = new Speech();
          this.emit(':responseReady');
        }
      }

      // intent's confirmation was denied
      else if (this.event.request.intent.confirmationStatus === 'DENIED') {
        speech.say(`Ok, canceling.`);
        this.emit(':tell', speech.ssml(true));
        speech = new Speech();
        this.emit(':responseReady');
      }

      // let alexa confirm that required slots are filled
      else {
        this.emit(':delegate');
      }
    }

    // mealkit and recipe slots filled
    else {
      const recipeRequested = this.event.request.intent.slots.recipe.value;
      const mealkitRequested = this.event.request.intent.slots.mealkit.value;
      const erRecipeStatus = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].status.code;
      const erMealkitStatus = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].status.code;

      // confirm validity of user's choice ("start {recipe} from {mealkit}" doesn't get checked otherwise)
      if (erMealkitStatus !== 'ER_SUCCESS_MATCH' || erRecipeStatus !== 'ER_SUCCESS_MATCH') {
        speech.say(`Sorry, I couldn't find ${recipeRequested} from ${mealkitRequested}.`);
        this.emit(':tell', speech.ssml(true));
        speech = new Speech();
        this.emit(':responseReady');
      }

      // set currentRecipe to the new choice and start reading it
      else {
        const resolvedRecipe = this.event.request.intent.slots.recipe.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const resolvedMealkit = this.event.request.intent.slots.mealkit.resolutions.resolutionsPerAuthority[0].values[0].value.name;

        this.attributes.foodBox = {
          'currentRecipe': recipes[resolvedMealkit][resolvedRecipe],
          'currentStep': 0
        };

        this.emit('Next');
      }
    }
  },

  'Next': function () {

    // no open recipe
    if (_.isEmpty(this.attributes) || _.isEmpty(this.attributes.foodBox.currentRecipe)) {
      speech.say(`You need to choose a recipe first.`);
      this.emit(':tell', speech.ssml(true));
      speech = new Speech();
      this.emit(':responseReady');
    }

    // read the next step
    else {
      const currentRecipe = this.attributes.foodBox.currentRecipe;
      let currentStep = this.attributes.foodBox.currentStep;
      const stepTotal = currentRecipe.steps.length;
      const lastIngredientIndex = currentRecipe.lastIngredientIndex;

      // very first step
      if (currentStep === 0) {
        speech.say('Grab the following ingredients: ');
        while (currentStep <= lastIngredientIndex) {
          speech.say(currentRecipe.steps[currentStep]).pause('3s');
          currentStep = ++this.attributes.foodBox.currentStep;
        }
        speech.say('Continue with the following steps: ');
      }

      speech.say(currentRecipe.steps[currentStep]);
      this.attributes.foodBox.currentStep++;

      // very last step
      if (currentStep >= stepTotal - 1) {
        speech.say(' This was the last step in this recipe. Enjoy your meal!');

        this.attributes.foodBox = {
          'currentRecipe': {},
          'currentStep': 0
        };
      }

    this.emit(':tell', speech.ssml(true));
    speech = new Speech();
    this.emit(':responseReady');
    }
  },

  'Repeat': function () {
    const currentStep = this.attributes.foodBox.currentStep;
    const lastIngredientIndex = this.attributes.foodBox.currentRecipe.lastIngredientIndex;

    // no open recipe
    if (_.isEmpty(this.attributes) || _.isEmpty(this.attributes.foodBox.currentRecipe)) {
      speech.say(`You need to choose a recipe first.`);
      this.emit(':tell', speech.ssml(true));
      speech = new Speech();
      this.emit(':responseReady');
    }


    // first step includes all ingredients
    else if (currentStep === lastIngredientIndex + 2) {
      this.attributes.foodBox.currentStep = 0;
      this.emit('Next');
    }

    // decrement currentStep and run Next
    else {
      this.attributes.foodBox.currentStep--;
      this.emit('Next');
    }
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
      .say('"Alexa, ask Food Box to repeat".')
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