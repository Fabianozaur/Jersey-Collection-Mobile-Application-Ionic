import Router from 'koa-router';
import jerseyStore from './store';
import { broadcast } from "../utils";

export const router = new Router();

  
router.get('/jerseys', async (ctx) => {
  
    const response = ctx.response
    const userId = ctx.state.user._id;
    response.body = await jerseyStore.find({ userId });
    response.status = 200; // ok
  });
  
router.get('/jersey/:id', async (ctx) => {
    const userId = ctx.state.user._id;
    const jersey = await jerseyStore.findOne({ _id: ctx.params.id });
    const response = ctx.response;
    if (jersey) {
        if (jersey.userId === userId) {
            response.body = jersey;
            response.status = 200; // ok
          } else {
            response.status = 403; // forbidden
          }
        } else {
          response.status = 404; // not found
        }
  });

const createJersey = async (ctx,jersey,response) => {
    console.log("Creating Jersey");
    try {
        const userId = ctx.state.user._id;
        jersey.userId = userId;
        response.body = await jerseyStore.insert(jersey);
        response.status = 201; // created
        broadcast(userId, { type: 'created', payload: response.body });
      } catch (err) {
        response.body = { message: err.message };
        response.status = 400; // bad request
      }
  };

  
  router.post('/jersey', async (ctx) => {
    await createJersey(ctx,ctx.request.body,ctx.response);
  });
  
  router.put('/jersey/:id', async (ctx) => {
    console.log("Editing Jersey");
    const jersey = ctx.request.body;
    const id = ctx.params.id;
    const jerseyId = jersey._id;
    const response = ctx.response;
    if (jerseyId && jerseyId !== id) {
        response.body = { message: 'Param id and body _id should be the same' };
        response.status = 400; // bad request
        return;
    }
    const userId = ctx.state.user._id;
    jersey.userId = userId;
    const updatedCount = await jerseyStore.update({ _id: id }, jersey);
    if (updatedCount === 1) {
        response.body = jersey;
        response.status = 200; // ok
        broadcast(userId, { type: 'updated', payload: jersey });
    } else {
        response.body = { message: 'Resource no longer exists' };
        response.status = 405; // method not allowed
    }
  });

  router.del('/jersey/:id', async (ctx) => {
    const userId = ctx.state.user._id;
    const jersey = await jerseyStore.findOne({ _id: ctx.params.id });
    if (jersey && userId !== jersey.userId) {
      ctx.response.status = 403; // forbidden
    } else {
      await jerseyStore.remove({ _id: ctx.params.id });
      ctx.response.status = 204; // no content
    }
  });
  