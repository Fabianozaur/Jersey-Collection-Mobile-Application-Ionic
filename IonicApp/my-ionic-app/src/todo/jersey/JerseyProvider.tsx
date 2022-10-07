import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../../core';
import { JerseyProps } from './JerseyProps';
import { createItem, getItems, createWebSocket, editItem, syncData } from './jerseyApi';
import { Plugins } from '@capacitor/core';
import { AuthContext } from '../auth';

const log = getLogger('JerseyProvider');
const { Storage } = Plugins;

export type SaveJerseyFn = (item: any) => Promise<any>;

export interface ItemsState {
  items? : JerseyProps[],
  fetching: boolean,
  fetchingError? : Error | null,
  saving: boolean,
  savingError? : Error | null,
  saveItem? : SaveJerseyFn,
  connectedNetwork?: boolean,
  setSavedOffline?: Function,
  savedOffline?: boolean
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  fetching: false,
  saving: false,
};

const FETCH_JERSEY_STARTED = 'FETCH_JERSEYS_STARTED';
const FETCH_JERSEYS_SUCCEEDED = 'FETCH_JERSEYS_SUCCEEDED';
const FETCH_JERSEYS_FAILED = 'FETCH_JERSEYS_FAILED';
const SAVE_JERSEY_STARTED = 'SAVE_JERSEY_STARTED';
const SAVE_JERSEY_SUCCEEDED = 'SAVE_JERSEY_SUCCEEDED';
const SAVE_JERSEY_FAILED = 'SAVE_JERSEY_FAILED';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_JERSEY_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_JERSEYS_SUCCEEDED:
        return { ...state, items: payload.items, fetching: false };
      case FETCH_JERSEYS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_JERSEY_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_JERSEY_SUCCEEDED:
        const items = [...(state.items || [])];
        const item = payload.item;
        const index = items.findIndex(it => it._id === item._id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, items, saving: false };
      case SAVE_JERSEY_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      default:
        return state;
    }
  };

export const JerseyContext = React.createContext<ItemsState>(initialState);

interface JerseyProviderProps {
  children: PropTypes.ReactNodeLike,
}

const {Network} = Plugins;

export const JerseyProvider: React.FC<JerseyProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);

  const [connectedNetworkStatus, setConnectedNetworkStatus] = useState<boolean>(false);
  Network.getStatus().then(status => setConnectedNetworkStatus(status.connected));
  const [savedOffline, setSavedOffline] = useState<boolean>(false);
  useEffect(networkEffect, [token, setConnectedNetworkStatus]);

  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, fetching, fetchingError, saving, savingError } = state;
  useEffect(getJerseysEffect, [token]);
  useEffect(wsEffect, [token]);
  const saveJersey = useCallback<SaveJerseyFn>(saveJerseyCallback, [token]);
  const value = { 
    items, 
    fetching, 
    fetchingError, 
    saving, 
    savingError, 
    saveItem: saveJersey, 
    connectedNetworkStatus, 
    savedOffline, 
    setSavedOffline   };
  log('returns');
  return (
    <JerseyContext.Provider value={value}>
      {children}
    </JerseyContext.Provider>
  );

  
  function networkEffect() {
    console.log("network effect");
    let canceled = false;
    Network.addListener('networkStatusChange', async (status) => {
        if (canceled) return;
        const connected = status.connected;
        if (connected) {
            console.log("networkEffect - SYNC data");
            await syncData(token);
        }
        setConnectedNetworkStatus(status.connected);
    });
    return () => {
        canceled = true;
    }
}

function getJerseysEffect() {
  let canceled = false;
  fetchJerseys();
  return () => {
      canceled = true;
  }

  async function fetchJerseys() {
      let canceled = false;
      fetchJerseys();
      return () => {
          canceled = true;
      }

      async function fetchJerseys() {
          if (!token?.trim()) return;
          if (!navigator?.onLine) {
              let storageKeys = Storage.keys();
              const jerseys = await storageKeys.then(async function (storageKeys) {
                  const saved = [];
                  for (let i = 0; i < storageKeys.keys.length; i++) {
                      if (storageKeys.keys[i] !== "token") {
                          const jersey = await Storage.get({key : storageKeys.keys[i]});
                          if (jersey.value != null)
                              var parsedJersey = JSON.parse(jersey.value);
                          saved.push(parsedJersey);
                      }
                  }
                  return saved;
              });
              dispatch({type: FETCH_JERSEYS_SUCCEEDED, payload: {items: jerseys}});
          } else {
              try {
                  log('fetchBooks started');
                  dispatch({type: FETCH_JERSEY_STARTED});
                  const items = await getItems(token);
                  log('fetchJerseys successful');
                  if (!canceled) {
                      dispatch({type: FETCH_JERSEYS_SUCCEEDED, payload: {items: items}})
                  }
              } catch (error) {
                  let storageKeys = Storage.keys();
                  const jerseys = await storageKeys.then(async function (storageKeys) {
                      const saved = [];
                      for (let i = 0; i < storageKeys.keys.length; i++) {
                          if (storageKeys.keys[i] !== "token") {
                              const jersey = await Storage.get({key : storageKeys.keys[i]});
                              if (jersey.value != null)
                                  var parsedJersey = JSON.parse(jersey.value);
                              saved.push(parsedJersey);
                          }
                      }
                      return saved;
                  });
                  dispatch({type: FETCH_JERSEYS_SUCCEEDED, payload: {items: jerseys}});
              }
          }
          
      }
  }
}


  async function saveJerseyCallback(item: JerseyProps) {
    try {
      if (navigator.onLine) {
        log('saveJersey started');
        dispatch({ type: SAVE_JERSEY_STARTED });
        const savedJersey = await (item._id ? editItem(token,item) : createItem(token,item));
        log('saveJersey succeeded');
        dispatch({ type: SAVE_JERSEY_SUCCEEDED, payload: { item: savedJersey } });
      }
      else{
        log('saveJersey failed');
                item._id = (item._id === undefined) ? ('_' + Math.random().toString(36).substr(2, 9)) : item._id;
                await Storage.set({
                  key: item._id!,
                  value: JSON.stringify({
                    _id: item._id,
                    teamName: item.teamName,
                    playerName: item.playerName,
                    playerNumber: item.playerNumber,
                    jerseyYear: item.jerseyYear,
                    sport: item.sport,
                    brand: item.brand,
                    isSigned: item.isSigned,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    webViewPath: item.webViewPath
                      })
                  });
                dispatch({type: SAVE_JERSEY_SUCCEEDED, payload: {item : item}});
                setSavedOffline(true);
      }
    } catch (error) {
      log('saveJersey failed');
      await Storage.set({
        key: String(item._id),
        value: JSON.stringify(item)
    })
      dispatch({ type: SAVE_JERSEY_FAILED, payload: { itme: item } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = createWebSocket(token, message => {
        if (canceled) {
          return;
        }
        const { type, payload: item } = message;
        log(`ws message, item ${type}`);
        if (type === 'created' || type === 'updated') {
          dispatch({ type: SAVE_JERSEY_SUCCEEDED, payload: { item } });
        }
      });
    }
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
    }
  }
};
