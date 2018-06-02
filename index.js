'use strict';

const Alexa = require('alexa-sdk');
const fs = require('fs');

let promptQueue = [];

var handlers = {
  'LaunchRequest': function() {
    this.attributes.foodBox = {
      'currentRecipe': {},
      'currentIngredient': 0,
      'currentStep': 0
    };

    const welcomeMessage = 'Hello, Welcome to Food Box!';
    const recipeQuestion = 'What would you like to cook?';

    this.emit(':ask', `${welcomeMessage} ${recipeQuestion}`, recipeQuestion);
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    const chosenRecipe = this.event.request.intent.slots.recipe.value;

    if (chosenRecipe === 'burger' || chosenRecipe === 'pasta') {
      const recipes = JSON.parse(fs.readFileSync('recipes.json'));
      this.attributes.foodBox.currentRecipe = recipes[chosenRecipe];

      promptQueue = [];
      promptQueue.push(`You chose ${chosenRecipe}. `);

      this.emitWithState('NextStep');
    } else {
      this.emit(':tell', `Sorry, I don't have a recipe for that.`);
      this.emit(':responseReady');
    }
  },
  'NextStep': function () {
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
      promptQueue.push('There are no more steps for this recipe. Bye!');
    }

    let message = promptQueue.join(' ');
    promptQueue = [];

    this.emit(':ask', message);
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};