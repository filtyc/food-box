const request = require('request');
const cheerio = require('cheerio');

const url = 'https://www.blueapron.com/recipes/soba-noodles-with-snow-peas-marinated-enoki-mushrooms';

let recipe = {};
let name = "";
let steps = [];
let lastIngredientIndex = 0;
let imageChangeIndexes = [];
let imageURLs = [];

request(url, (err, res, html) => {
  if (!err) {
    const $ = cheerio.load(html);

    name = $('h1[class="ba-recipe-title__main"]').text().split('\n')[1].trim()

    // ingredients
    $('li[itemprop="ingredients"]').text((i, e) => {
      steps.push(e.replace(/(\n)/gm, ' ').replace(/(\s\s+)/gm, ' ').trim() + '.');
    })

    lastIngredientIndex = steps.length - 1;

    // steps
    $('div[class="step-txt"] > p').text((i, e) => {
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
    $('div[class="col-md-6 col-xs-12"] > img').attr('src', (i, e) => {
      imageURLs.push(e);
    });
  }

  recipe[name] = {
    name,
    mealkit: 'Blue Apron',
    steps,
    lastIngredientIndex,
    imageURLs,
    imageChangeIndexes
  };

  console.log(JSON.stringify(recipe, null, 2));
});

