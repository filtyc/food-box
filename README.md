Food Box is an Alexa skill that reads meal kit recipes. Users can choose and navigate recipes using voice commands:

<div align="center"><img src=demos/dialog.gif width=424 height=508 /></div>

<br>Optionally, Echo devices with screens display a picture relevant to the given step:

<div align="center"><img src=demos/display.png width=661 height=419 /></div>

<br>The back end is implemented using [Alexa Skills Kit SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs) and deployed to AWS Lambda. Session attributes get stored in DynamoDB. Additionally, the [webscrapers directory](https://github.com/filtyc/food-box/tree/master/webscrapers) contains jQuery-based scripts that obtain and format recipe data from Blue Apron and Purple Carrot.
