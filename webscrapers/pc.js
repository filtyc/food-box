const fs = require('fs');

const rp = require('request-promise-native');
const cheerio = require('cheerio');

const PC = 'Purple Carrot';
let recipeUrls = [];
let recipeNames = [];
let recipes = {[PC]: {}};
let options = {transform: body => cheerio.load(body)};
let modelValues = [];


const getRecipeUrls = async () => {
  try {
    const $ = await rp(options);

    $('a.c-recipe--featured').attr('href', (i, e) => {
      recipeUrls.push('https://www.purplecarrot.com/' + e);
    });
  }
  catch(err) {
    console.log(err);
  }
};

const fetchRecipe = async () => {
  let name = "";
  let steps = [];
  let lastIngredientIndex = 0;
  let imageChangeIndexes = [];
  let imageURLs = [];

  try {
    const $ = await rp(options);

    name = $('h1.c-recipe-details-header__title').text().trim();
    recipeNames.push(name);

    // ingredients
    $('ol.u-text li').text((i, e) => {
      let step = e.trim().replace(/(\s\s+)/gm, ' ');
      if (!step.startsWith('*') && !step.endsWith('*')) steps.push(step + '.');
    });

    lastIngredientIndex = steps.length - 1;

    // steps
    $('div.u-text').text((i, e) => {
      if (i > 0) {
        for (let step of e.split('.')) {
          step = step.trim();
          if (step) {
            steps.push(step + '.');
          }
        }
        imageChangeIndexes.push(steps.length);
      }
    });

    imageChangeIndexes.pop();

    // images
    $('div.c-recipe-details-section picture img').attr('src', (i, e) => {
      if (e.includes('Step')) imageURLs.push(e);
    });

    recipes[PC][name] = {
      name,
      mealkit: PC,
      steps,
      lastIngredientIndex,
      imageURLs,
      imageChangeIndexes
    };
  }
  catch(err) {
    console.log(err);
  }
};

const getModelValues = () => {
  for (const recipeName of recipeNames) {
    modelValues.push({'name': {'value': recipeName}});
  }
};

scrape = async () => {
  options.uri = 'https://www.purplecarrot.com/plant-based-recipes';
  await getRecipeUrls();

  for (const recipeUrl of recipeUrls) {
    options.uri = recipeUrl;
    await fetchRecipe();
  }

  getModelValues();

  fs.writeFileSync('output/pc-recipes.json', JSON.stringify(recipes, null, 2));
  fs.writeFileSync('output/pc-modelValues.json', JSON.stringify(modelValues, null, 4));
};

scrape();