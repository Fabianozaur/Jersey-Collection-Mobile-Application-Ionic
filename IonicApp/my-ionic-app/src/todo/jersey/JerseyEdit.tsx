import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/react';
import { getLogger } from '../../core';
import { JerseyContext } from './JerseyProvider';
import { RouteComponentProps } from 'react-router';
import { JerseyProps } from './JerseyProps';
import { useMyLocation } from '../../core/useMyLocation';
import { usePhotoGallery } from '../../core/usePhotoGallery';
import moment from 'moment';
import { MyMap } from '../../core/MyMap';



interface JerseyEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const JerseyEdit: React.FC<JerseyEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem } = useContext(JerseyContext);
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [jerseyYear, setJerseyYear] = useState('');
  const [sport, setSport] = useState('');
  const [brand, setBrand] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [playerNumber, setPlayerNumber] = useState(0);
  const [item, setItem] = useState<JerseyProps>();

  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [currentLatitude, setCurrentLatitude] = useState<number | undefined>(undefined);
  const [currentLongitude, setCurrentLongitude] = useState<number | undefined>(undefined);
  const [webViewPath, setWebViewPath] = useState('');

  const location = useMyLocation();
  const {latitude : lat, longitude : lng} = location.position?.coords || {};

  const {takePhoto} = usePhotoGallery();

  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const item = items?.find(it => it._id === routeId);
    setItem(item);
    if (item) {
      setPlayerName(item.playerName);
      setTeamName(item.teamName);
      setPlayerNumber(item.playerNumber);
      setJerseyYear(item.jerseyYear)
      setBrand(item.brand);
      setSport(item.sport);
      setIsSigned(item.isSigned);
      setLatitude(item.latitude);
      setLongitude(item.longitude);
      setWebViewPath(item.webViewPath);
    }
  }, [match.params.id, items]);

  useEffect(() => {
    if (latitude === undefined && longitude === undefined) {
        setCurrentLatitude(lat);
        setCurrentLongitude(lng);
    } else {
        setCurrentLatitude(latitude);
        setCurrentLongitude(longitude);
    }
}, [lat, lng, longitude, latitude]);

  const handleSave = () => {
    log('entered handleSave');
    const editedJersey = item ? { ...item, teamName,playerName,playerNumber,jerseyYear,sport,brand,isSigned,latitude: latitude, longitude: longitude, webViewPath: webViewPath  } : { teamName,playerName,playerNumber,jerseyYear,sport,brand,isSigned,latitude: latitude, longitude: longitude, webViewPath: webViewPath  };
    saveItem && saveItem(editedJersey).then(() =>{ history.goBack(); });
  };

  async function handlePhotoChange() {
    const image = await takePhoto();
    if (!image) {
        setWebViewPath('');
    } else {
        setWebViewPath(image);
    }
}

function setLocation() {
    setLatitude(currentLatitude);
    setLongitude(currentLongitude);
}

  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit Jersey</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save 
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>Team Name:  </IonLabel>
          <IonInput value={teamName} onIonChange={e => setTeamName(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Player Name:  </IonLabel>
          <IonInput value={playerName} onIonChange={e => setPlayerName(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Player Number:  </IonLabel>
          <IonInput type ="number" value={playerNumber} onIonChange={e => setPlayerNumber(parseInt(e.detail.value! ,10) || 0)} />
        </IonItem>
        <IonItem>
          <IonLabel>Jersey Year: </IonLabel>
          <IonDatetime displayFormat="YYYY" pickerFormat="YYYY" value={jerseyYear} onBlur={e => setJerseyYear((moment(e.target.value).format('YYYY')) || moment(new Date()).format('YYYY'))}/>
        </IonItem>
        <IonItem>
          <IonLabel>Sport: </IonLabel>
          <IonInput value={sport} onIonChange={e => setSport(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Brand: </IonLabel>
          <IonInput value={brand} onIonChange={e => setBrand(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Is the Jersey Signed ?: </IonLabel>
          <IonToggle checked={isSigned} onIonChange={e => setIsSigned(e.detail.checked)} />
        </IonItem>
        
        <IonItem>
                <IonLabel>Where have you bought it from ?</IonLabel>
                <IonButton onClick={setLocation}>Set location</IonButton>
            </IonItem>

            {webViewPath && (<img onClick={handlePhotoChange} src={webViewPath} width={'50px'} height={'50px'}/>)}
            {!webViewPath && (<img onClick={handlePhotoChange} src={'https://static.thenounproject.com/png/187803-200.png'} width={'100px'} height={'100px'}/>)}

            {lat && lng &&
                <MyMap
                   lat={currentLatitude}
                   lng={currentLongitude}
                   onMapClick={log('onMap')}
                   onMarkerClick={log('onMarker')}
                />
            }

        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );

  function log(source: string) {
    return (e: any) => {
    setCurrentLatitude(e.latLng.lat());
    setCurrentLongitude(e.latLng.lng());
    console.log(source, e.latLng.lat(), e.latLng.lng());
    }
}
};

export default JerseyEdit;
