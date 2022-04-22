const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { mongooseConnect, SDL, ClientData } = require('./mongodb');

const app = express();
const resolvers = {
  sendData: async ({ data }, { industry }) => {
    const storedData = await ClientData.create({
      industry,
      data,
    });
    return storedData.data;
  },
};

const registeredSchemas = {};
const ttlMinutes = 0.2;
const schemaRegisterMiddleware = async (req, res, next) => {
  const endpoint = req.path.split('/').pop();
  if (registeredSchemas[endpoint]) {
    const expirationDate = registeredSchemas[endpoint];
    if (
      expirationDate &&
      Date.parse(expirationDate) - Date.parse(new Date()) > 0
    ) {
      return next();
    }
  }

  const sdlDoc = await SDL.findOne({ isActive: true, industry: endpoint })
    .lean()
    .exec();
  if (!sdlDoc) {
    if (registeredSchemas[endpoint]) {
      delete registeredSchemas[endpoint];
      const layerIndex = app._router.stack.indexOf(
        (layer) => layer.path === `/graphql/${endpoint}`
      );
      app._router.stack.splice(layerIndex, 1);
    }
    return res
      .status(404)
      .json({ message: `SDL does not exist on endpoint ${endpoint}` });
  }

  registeredSchemas[endpoint] = new Date(
    new Date().getTime() + ttlMinutes * 60000
  );
  app.use(
    `/graphql/${sdlDoc.industry}`,
    graphqlHTTP({
      schema: buildSchema(sdlDoc.sdl),
      graphiql: true,
      rootValue: resolvers,
      context: { industry: sdlDoc.industry },
    })
  );
  next();
};

app.use('/graphql', schemaRegisterMiddleware);

const start = async () => {
  await mongooseConnect();
  await app.listen(4000);
  console.log('Running on 4000');
};
start();
