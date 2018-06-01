'use strict';

const Alexa = require('alexa-sdk');

const burgerRecipe = 'Ingredients. 1 10-Once Skin-On Salmon Fillet. 1 Pasture-Raised Egg. 2 Potato Buns. 1 clove Garlic. 3/4 lb Golden Potatoes. 1/4 cup Panko Breadcrumbs. 1/4 cup Sour Cream. 2 Tbsps Sweet Pickle Relish. 1 Tbsp  Smoky Spice Blend. Steps. Place an oven rack in the center of the oven, then preheat to 450°F. Wash and dry the fresh produce. Large dice the potatoes. Peel and finely chop the garlic; using the flat side of your knife, smash until it resembles a paste (or use a zester). Halve the buns. In a bowl, combine the sour cream and pickle relish; season with salt and pepper to taste. Line a sheet pan with aluminum foil. Place the diced potatoes on the foil. Drizzle with olive oil and season with salt, pepper, and half the spice blend; toss to coat. Arrange in an even layer. Roast 23 to 25 minutes, or until browned and tender when pierced with a fork. Remove from the oven. While the potatoes roast, pat the fish dry with paper towels; season with salt and pepper on both sides. In a medium pan (nonstick, if you have one), heat 2 teaspoons of olive oil on medium until hot. Add the seasoned fish, skinless side down. Loosely cover with aluminum foil and cook 4 to 5 minutes per side, or until lightly browned (the fish will not be cooked through yet). Transfer to a large bowl. When cool enough to handle, carefully remove and discard the skin. Using two forks, flake the fish into small pieces. Wipe out the pan. While the potatoes continue to roast, to the bowl of flaked fish, add the egg, breadcrumbs, garlic paste, and remaining spice blend. Season with salt and pepper; gently mix to thoroughly combine. Using your hands, form the mixture into two 3/4-inch-thick patties. In the same pan, heat 2 teaspoons of olive oil on medium-high until hot. Carefully add the patties and cook 3 to 4 minutes per side, or until browned and cooked through. Leaving any browned bits (or fond) in the pan, transfer to a plate. Add the buns, cut side down, to the pan of reserved fond (if the pan seems dry, add a drizzle of olive oil). Toast on medium-high 30 seconds to 1 minute, or until lightly browned. Transfer to a work surface. Assemble the burgers using the toasted buns, tartar sauce, and cooked patties. Serve the burgers with the roasted potatoes on the side. Enjoy!';
const burgerRecipeSteps = burgerRecipe.split('.');

var handlers = {
  'LaunchRequest': function() {
    this.attributes.currentStep = -1;

    const welcomeMessage = 'Hello, Welcome to Food Box!';
    const recipeQuestion = 'What would you like to cook?';

    this.emit(':ask', `${welcomeMessage} ${recipeQuestion}`, recipeQuestion);
    this.emit(':responseReady');
  },
  'ChooseRecipe': function () {
    const chosenRecipe = this.event.request.intent.slots.recipe.value;

    if (chosenRecipe === 'burger') {
      this.emit(':ask', `You chose ${chosenRecipe}. Say next step when you are ready for it.`, `Say next step when you are ready for it`);
    } else {
      this.emit(':tell', `Sorry, I don't have a recipe for that.`);
    }

    this.emit(':responseReady');
  },
  'NextStep': function () {
    this.attributes.currentStep++;
    this.emit(':ask', `${burgerRecipeSteps[this.attributes.currentStep]}`);
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};