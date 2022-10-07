import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {  JerseyList } from './todo/jersey';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { JerseyProvider } from './todo/jersey/JerseyProvider';
import { AuthProvider, Login, PrivateRoute } from './todo/auth';
import JerseyEdit from './todo/jersey/JerseyEdit';

const App: React.FC = () => (
  <IonApp>
  <IonReactRouter>
    <IonRouterOutlet>
      <AuthProvider>
        <Route path="/login" component={Login} exact={true}/>
        <JerseyProvider>
          <PrivateRoute path="/api/items/jerseys" component={JerseyList} exact={true} />
          <PrivateRoute path="/api/items/jersey" component={JerseyEdit} exact={true} />
          <PrivateRoute path="/api/items/jersey/:id" component={JerseyEdit} exact={true} />
        </JerseyProvider>
        <Route exact path="/" render={() => <Redirect to="/api/items/jerseys" />} />
      </AuthProvider>
    </IonRouterOutlet>
  </IonReactRouter>
</IonApp>
);

export default App;
