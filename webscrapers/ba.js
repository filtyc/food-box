const fs = require('fs');

const rp = require('request-promise-native');
const cheerio = require('cheerio');

let recipeUrls = [];
let recipeNames = [];
let recipes = {'Blue Apron': {}};
let options = {transform: body => cheerio.load(body)};
let modelValues = [];


const getRecipeUrls = async () => {
  try {
    const $ = await rp(options);

    $('a.recipe-card').attr('href', (i, e) => {
      if (i < 8) recipeUrls.push('https://www.blueapron.com' + e);
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

    name = $('h1.ba-recipe-title__main').text().split('\n')[1].trim();
    recipeNames.push(name);

    // ingredients
    $('li[itemprop="ingredients"]').text((i, e) => {
      steps.push(e.replace(/(\n)/gm, ' ').replace(/(\s\s+)/gm, ' ').trim() + '.');
    });

    lastIngredientIndex = steps.length - 1;

    // steps
    $('div.step-txt').text((i, e) => {
      for (let step of e.split('.')) {
        step = step.trim();
        if (step) {
          steps.push(step + '.');
        }
      }
      imageChangeIndexes.push(steps.length);
    });

    imageChangeIndexes.pop();

    // images
    $('div.col-md-6.col-xs-12 > img').attr('src', (i, e) => {
      imageURLs.push(e);
    });

    recipes['Blue Apron'][name] = {
      name,
      mealkit: 'Blue Apron',
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
  options.uri = 'https://www.blueapron.com/pages/sample-recipes';
  await getRecipeUrls();

  for (const recipeUrl of recipeUrls) {
    options.uri = recipeUrl;
    await fetchRecipe();
  }

  getModelValues();

  fs.writeFileSync('output/ba-recipes.json', JSON.stringify(recipes, null, 2));
  fs.writeFileSync('output/ba-modelValues.json', JSON.stringify(modelValues, null, 4));
};

scrape();