import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { JerseyProps } from './JerseyProps';

interface JerseyPropsExt extends JerseyProps {
  onEdit: (_id?: string) => void;
}

const Jersey: React.FC<JerseyPropsExt> = ({ _id, teamName,playerName,playerNumber,jerseyYear,sport,brand,isSigned, latitude, longitude, webViewPath, onEdit }) => {
  
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.getElementById("image")!.addEventListener('click', () => {
        setShowModal(true);
    });
  }, [document.getElementById("image")]);

  useEffect(() => {
  document.getElementById("item")!.addEventListener('click', () => {
      onEdit(_id);
  });
  }, [document.getElementById("item")]);


  return (
    
    <IonItem onClick={()=>onEdit(_id)} id="item">
    
      <IonLabel >{teamName}</IonLabel>
      <></>
      <IonLabel >{playerName}</IonLabel>
      <IonLabel >{playerNumber}</IonLabel>
      {/* <IonLabel >{latitude}</IonLabel>
      <IonLabel>{longitude}</IonLabel> */}
      <IonLabel ><img id="image" src={webViewPath}/> </IonLabel>
      {/* <IonLabel>{jerseyYear}</IonLabel>
      <IonLabel>{sport}</IonLabel>
      <IonLabel>{brand}</IonLabel>
      <IonLabel>{String(isSigned)}</IonLabel> */}
    </IonItem>
  );
};

export default Jersey;
