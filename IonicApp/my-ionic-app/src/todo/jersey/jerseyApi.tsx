import { Plugins } from '@capacitor/core';
import axios from 'axios';
import { authConfig, getLogger, withLogs } from '../../core';
import { JerseyProps } from './JerseyProps';

const log = getLogger('jerseyApi');
const { Storage } = Plugins;

const base = 'localhost:3000';
const baseUrl = `http://${base}/api/items`;


interface MessageData {
  type: string;
  payload: JerseyProps;
  
}

const different = (j1: any, j2: any) => {
  if (j1.teamName === j2.teamName && j1.playerName === j2.playerName && j1.playerNumber === j2.playerNumber && j1.sport === j2.sport)
    return false;
  return true;
}

export const syncData: (token: string) => Promise<JerseyProps[]> = async token => {
  try {
    const { keys } = await Storage.keys();
    var result = axios.get(`${baseUrl}/jerseys`, authConfig(token));
    result.then(async result => {
      keys.forEach(async i => {
        if (i !== 'token') {
          const jerseyOnServer = result.data.find((each: { _id: string; }) => each._id === i);
          const jerseyLocal = await Storage.get({key: i});

          console.log('JERSEY ON SERVER: ' + JSON.stringify(jerseyOnServer));
          console.log('JERSEY LOCALLY: ' + jerseyLocal.value!);

          if (jerseyOnServer !== undefined && different(jerseyOnServer, JSON.parse(jerseyLocal.value!))) {  // actualizare
            console.log('UPDATE ' + jerseyLocal.value);
            axios.put(`${baseUrl}/jersey/${i}`, JSON.parse(jerseyLocal.value!), authConfig(token));
          } else if (jerseyOnServer === undefined){  // creare
            console.log('CREATE' + jerseyLocal.value!);
            axios.post(`${baseUrl}/jersey`, JSON.parse(jerseyLocal.value!), authConfig(token));
          }
        }
        })
    }).catch(err => {
      if (err.response) {
        console.log('client received an error response (5xx, 4xx)');
      } else if (err.request) {
        console.log('client never received a response, or request never left');
      } else {
        console.log('anything else');
      }
  })
    return withLogs(result, 'syncItems');
  } catch (error) {
    throw error;
  }    
}

export const getItems: (token: string) => Promise<JerseyProps[]> = token => {  
  try {
    var result = axios.get(`${baseUrl}/jerseys`, authConfig(token));
    result.then(async result => {
      for (const each of result.data) {
          await Storage.set({
            key: each._id!,
            value: JSON.stringify({
              _id: each._id,
              teamName: each.teamName,
              playerName: each.playerName,
              playerNumber: each.playerNumber,
              jerseyYear: each.jerseyYear,
              sport: each.sport,
              brand: each.brand,
              isSigned: each.isSigned,
              latitude: each.latitude,
              longitude: each.longitude,
              webViewPath: each.webViewPath
            })
          });
      }
    }).catch(err => {
      if (err.response) {
        console.log('client received an error response (5xx, 4xx)');
      } else if (err.request) {
        console.log('client never received a response, or request never left');
      } else {
        console.log('anything else');
      }
  })
    return withLogs(result, 'getItems');
  } catch (error) {
    throw error;
  }    
}

export const createItem: (token: string, jersey: JerseyProps) => Promise<JerseyProps[]> = (token, jersey) => {
  var result = axios.post(`${baseUrl}/jersey`, jersey, authConfig(token));
  result.then(async result => {
    var one = result.data;
    await Storage.set({
      key: one._id!,
            value: JSON.stringify({
              _id: one._id,
              teamName: one.teamName,
              playerName: one.playerName,
              playerNumber: one.playerNumber,
              jerseyYear: one.jerseyYear,
              sport: one.sport,
              brand: one.brand,
              isSigned: one.isSigned,
              latitude: one.latitude,
              longitude: one.longitude,
              webViewPath: one.webViewPath
            })
    });
  }).catch(err => {
    if (err.response) {
      console.log('client received an error response (5xx, 4xx)');
    } else if (err.request) {
      alert('');
    } else {
      console.log('anything else');
    }
});
  return withLogs(result, 'createItem');
}

export const editItem: (token: string, jersey: JerseyProps) => Promise<JerseyProps[]> = (token, jersey) => {
  var result = axios.put(`${baseUrl}/jersey/${jersey._id}`, jersey, authConfig(token));
  result.then(async result => {
    var one = result.data;
    await Storage.set({
      key: one._id!,
      value: JSON.stringify({
        _id: one._id,
        teamName: one.teamName,
        playerName: one.playerName,
        playerNumber: one.playerNumber,
        jerseyYear: one.jerseyYear,
        sport: one.sport,
        brand: one.brand,
        isSigned: one.isSigned,
        latitude: one.latitude,
        longitude: one.longitude,
        webViewPath: one.webViewPath
      })
    }).catch(err => {
      // if (err.response) {
      //   alert('client received an error response (5xx, 4xx)');
      // } else if (err.request) {
      //   alert('client never received a response, or request never left');
      // } else {
      //   alert('anything else');
      // }
  })
  });
  return withLogs(result, 'updateItem');
}

export const createWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${base}`);
  ws.onopen = () => {
    log('web socket onopen');
    ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
  };
  ws.onclose = function (event) {
    console.log(event);
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
    ws.close();
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}