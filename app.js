var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');

/** Use bot LUIS model for the root dialog. */
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=e3327a4f-2e5c-4fde-afbf-ee8e3ea87ca3&subscription-key=ae1f72bf978948ada602710e92b1908c';
var dialog = new builder.LuisDialog(model);
var bot = new builder.BotConnectorBot();
bot.add('/', dialog);

bot.listen();

/** Answer help related questions like "what can I say?" */
dialog.on('Help', builder.DialogAction.send(prompts.helpMessage));

/** Answer acquisition related questions like "how many companies has microsoft bought?" */
dialog.on('Type', [askService, answerQuestion('type', prompts.answerType)]);

/** Answer IPO date related questions like "when did microsoft go public?" */
dialog.on('Function', [askService, answerQuestion('function', prompts.answerFunction)]);

/** Answer description related questions like "tell me about microsoft" */
dialog.on('Description', [askService, answerQuestion('description', prompts.answerDescription)]);

/** Answer headquarters related questions like "where is microsoft located?" */
dialog.on('Location', [askService, answerQuestion('location', prompts.answerLocation)]);

/** Answer website related questions like "how can I contact microsoft?" */
dialog.on('Website', [askService, answerQuestion('website', prompts.answerWebsite)]);


/** 
 * This function the first step in the waterfall for intent handlers. It will use the service mentioned
 * in the users question if specified and valid. Otherwise it will use the last service a user asked 
 * about. If it the service is missing it will prompt the user to pick one. 
 */
function askService(session, args, next) {
    // First check to see if we either got a service from LUIS or have a an existing service
    // that we can multi-turn over.
    var service;
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'ServiceName');
    if (entity) {
        // The user specified a service so lets look it up to make sure its valid.
        // * This calls the underlying function Prompts.choice() uses to match a users response
        //   to a list of choices. When you pass it an object it will use the field names as the
        //   list of choices to match against. 
        service = builder.EntityRecognizer.findBestMatch(data, entity.entity);
    } else if (session.dialogData.service) {
        // Just multi-turn over the existing service
        service = session.dialogData.ServiceName;
    }
   
    // Prompt the user to pick a service if they didn't specify a valid one.
    if (!service) {
        // Lets see if the user just asked for a service we don't know about.
        var txt = entity ? session.gettext(prompts.serviceUnknown, { service: entity.entity }) : prompts.serviceUnknown;
        
        // Prompt the user to pick a service from the list. They can also ask to cancel the operation.
        builder.Prompts.choice(session, txt, data);
    } else {
        // Great! pass the service to the next step in the waterfall which will answer the question.
        // * This will match the format of the response returned from Prompts.choice().
        next({ response: service })
    }
}

/**
 * This function generates a generic answer step for an intent handlers waterfall. The service to answer
 * a question about will be passed into the step and the specified field from the data will be returned to 
 * the user using the specified answer template. 
 */
function answerQuestion(field, answerTemplate) {
    return function (session, results) {
        // Check to see if we have a service. The user can cancel picking a service so IPromptResult.response
        // can be null. 
        if (results.response) {
            // Save service for multi-turn case and compose answer            
            var service = session.dialogData.service = results.response;
            var answer = { service: service.entity, value: data[service.entity][field] };
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}


/** 
 * Sample data 
 */
var data = {
  'Planned Parenthood': {
      type: 'Family Care Centers',
      function: 'sex education',
      description: 'Planned Parenthood Federation of America (PPFA), or Planned Parenthood, is a nonprofit organization that provides reproductive health services in the United States and internationally. A member association of the International Planned Parenthood Federation (IPPF), PPFA has its roots in Brooklyn, New York, where Margaret Sanger opened the first birth control clinic in the U.S. in 1916. In 1921, Sanger founded the American Birth Control League, which changed its name to Planned Parenthood in 1942. Planned Parenthood is made up of 58 affiliates, which operate more than 650 health clinics in the United States, and it also partners with organizations in 12 countries globally.  The organization directly provides a variety of reproductive health services and sexual education, contributes to research in reproductive technology, and does advocacy work aimed at protecting and expanding reproductive rights',
      location: '650+ clinic locations, see website for more information',
      website: 'https://www.plannedparenthood.org'
  },
    'Alcoholics Anonymous': {
      type: 'Substance Abuse Center',
      function: 'drug rehabilitation, substance abuse, and codepency support',
      description: 'Alcoholics Anonymous (AA) is an international mutual aid fellowship founded in 1935 by Bill Wilson and Dr. Bob Smith in Akron, Ohio. AAs stated "primary purpose" is to help alcoholics "stay sober and help other alcoholics achieve sobriety".[2][3][4] With other early members Bill Wilson and Bob Smith developed AAs Twelve Step program of spiritual and character development. AAs initial Twelve Traditions were introduced in 1946 to help the fellowship be stable and unified while disengaged from "outside issues" and influences. The Traditions recommend that members and groups remain anonymous in public media, altruistically helping other alcoholics and avoiding official affiliations with other organization. The Traditions also recommend that those representing AA avoid dogma and coercive hierarchies. Subsequent fellowships such as Narcotics Anonymous have adopted and adapted the Twelve Steps and the Twelve Traditions to their respective primary purposes',
      location: 'in most areas, for local listings try an internet search engine like http://bing.com',
      website: 'http://www.aa.org/'
  },
    'Narcotics Anonymous': {
      type: 'Substance Abuse Center',
      function: 'drug rehabilitation, substance abuse, and codepency support',
      description: 'Narcotics Anonymous (NA) describes itself as a "nonprofit fellowship or society of men and women for whom drugs had become a major problem". Narcotics Anonymous uses a traditional 12-step model that has been expanded and developed for people with varied substance abuse issues and is the second-largest 12-step organization.',
      location: 'As of May 2014 there were more than 63,000 NA meetings in 132 countries.  For local listings try an internet search engine like http://bing.com',
      website: 'https://www.na.org/'
  },
  'National Center for children and families': {
      type: 'Local Child & Family Services',
      function: 'Private Domestic Foster Care and Adoption Agencies',
      description: 'Agencies included on this list have a verified child-placing license in the State or territory in which they are practicing at the time of inclusion in the National Foster Care & Adoption Directory.',
      location: '220 I Street NE, Ste 120, Washington, District of Columbia 20002',
      website: 'http://www.nccf-cares.org/'
  },
   'Progressive Life Center': {
      type: 'Local Child & Family Services',
      function: 'Kinship,Foster Care and Adoption Support Groups, Private Domestic Foster Care and Adoption Agencies, Private Intercountry Adoption Agencies',
      description: 'Foster families allow PLC to provide the support and structure that a child needs at this time in a more loving and nurturing environment than an institution.',
      location: '1933 Montana Ave., NE, Washington, District of Columbia 20002',
      website: 'http://www.nccf-cares.org/'
  },
   'Lutheran Social Services of the National Capital Area': {
      type: 'Local Child & Family Services',
      function: 'Private Domestic Foster Care and Adoption Agencies, Private Intercountry Adoption Agencies',
      description: 'Lutheran Social Services of the National Capital Area (LSS/NCA) has devoted nearly a century to walking with those in need throughout the Washington D.C. Metro Area.',
      location: '4406 Georgia Avenue NW, Washington, District of Columbia 20011-7124',
      website: 'http://lssnca.org/'
  }

};

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});