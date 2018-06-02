'use strict';

const Alexa = require('alexa-sdk');
const fs = require('fs');

let promptQueue = [];

var handlers = {
  'LaunchRequest': function() {
    promptQueue = [];
    let welcomeMessage = '';
    const recipeQuestion = 'What would you like to cook?';

    if (Object.keys(this.attributes).length === 0) {
      this.attributes.foodBox = {
        'currentRecipe': {},
        'currentIngredient': 0,
        'currentStep': 0
      };

      welcomeMessage = 'Welcome to Food Box: an Alexa skill that can read Blue Apron recipes for you. After you choose what you would like to cook you can keep asking for the next step, or for the current step to be repeated, until the recipe is finished. If you need to pause, simply say stop. Your progress will be saved.';
    } else if (Object.keys(this.attributes.foodBox.currentRecipe).length !== 0) {
      promptQueue.push(`You were cooking ${this.attributes.foodBox.currentRecipe.fullName} and your last step was: `);
      this.emitWithState('Repeat');
    } else {
      welcomeMessage = 'Welcome back!';
    }

    this.emit(':ask', `${welcomeMessage} ${recipeQuestion}`);
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    const chosenRecipe = this.event.request.intent.slots.recipe.value;

    if (chosenRecipe === 'burger' || chosenRecipe === 'pasta') {
      const recipes = JSON.parse(fs.readFileSync('recipes.json'));
      this.attributes.foodBox.currentRecipe = recipes[chosenRecipe];

      promptQueue = [];
      promptQueue.push(`You chose ${chosenRecipe}. `);

      this.emitWithState('Next');
    } else {
      this.emit(':tell', `Sorry, I don't have a recipe for that.`);
      this.emit(':responseReady');
    }
  },
  'Next': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    let currentIngredient = this.attributes.foodBox.currentIngredient;
    let currentStep = this.attributes.foodBox.currentStep;

    if (currentIngredient < currentRecipe.ingredients.length) {
      if (currentIngredient === 0) {
        promptQueue.push('Grab the following ingredients: ');
      }
      promptQueue.push(`${currentRecipe.ingredients[currentIngredient]}`);
      this.attributes.foodBox.currentIngredient++;
    } else if (currentStep < currentRecipe.steps.length) {
      if (currentStep === 0) {
        promptQueue.push('Continue with the following steps: ');
      }
      promptQueue.push(`${currentRecipe.steps[currentStep]}`);
      this.attributes.foodBox.currentStep++;
    } else {
      this.attributes.foodBox.currentRecipe = {};
      this.attributes.foodBox.currentIngredient = 0;
      this.attributes.foodBox.currentStep = 0;

      promptQueue.push('There are no more steps for this recipe. Goodbye!');
    }

    let message = promptQueue.join(' ');
    promptQueue = [];

    this.emit(':ask', message);
    this.emit(':responseReady');
  },
  'Repeat': function () {
    const currentRecipe = this.attributes.foodBox.currentRecipe;
    let currentIngredient = this.attributes.foodBox.currentIngredient;
    let currentStep = this.attributes.foodBox.currentStep;

    if (currentIngredient !== 0 || currentStep !== 0) {
      if (currentIngredient < currentRecipe.ingredients.length || currentStep === 0) {
        this.attributes.foodBox.currentIngredient--;
      } else {
        this.attributes.foodBox.currentStep--;
      }
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