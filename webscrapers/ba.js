const fs = require('fs');

const rp = require('request-promise-native');
const cheerio = require('cheerio');

let recipeUrls = [];
let recipes = {};
let rpOptions = {
  uri: 'https://www.blueapron.com/pages/sample-recipes',
  transform: (body) => cheerio.load(body),
};

rp(rpOptions).then(($) => {

  $('a.recipe-card').attr('href', (i, e) => {
    if (i < 8) {
      recipeUrls.push('https://www.blueapron.com' + e);
    }
  });

  recipeUrls.forEach((recipeUrl) => {

    rpOptions.uri = recipeUrl;

    let name = "";
    let steps = [];
    let lastIngredientIndex = 0;
    let imageChangeIndexes = [];
    let imageURLs = [];

    rp(rpOptions).then(($) => {

      name = $('h1.ba-recipe-title__main').text().split('\n')[1].trim();

      // ingredients
      $('li[itemprop="ingredients"]').text((i, e) => {
        steps.push(e.replace(/(\n)/gm, ' ').replace(/(\s\s+)/gm, ' ').trim() + '.');
      })

      lastIngredientIndex = steps.length - 1;

      // steps
      $('div.step-txt > p').text((i, e) => {
        for (let step of e.split('.')) {
          step = step.trim();
          if (step) {
            steps.push(step + '.');
          }
        }
        imageChangeIndexes.push(steps.length);
      })

      imageChangeIndexes.pop();

      // images
      $('div.col-md-6.col-xs-12 > img').attr('src', (i, e) => {
        imageURLs.push(e);
      });


      recipes[name] = {
        name,
        mealkit: 'Blue Apron',
        steps,
        lastIngredientIndex,
        imageURLs,
        imageChangeIndexes
      };

      fs.writeFileSync('output/ba-recipes.json', JSON.stringify(recipes, null, 2));

    }).catch((err) => {
      console.log(err);
    });

  });

}).catch((err) => {
  console.log(err);
});
