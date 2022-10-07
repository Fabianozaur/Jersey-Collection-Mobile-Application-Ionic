import React, { useContext,useEffect,useState } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList, IonLoading,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { getLogger } from '../../core';
import { JerseyContext } from './JerseyProvider';
import { AuthContext } from '../auth';
import { JerseyProps } from './JerseyProps';
import { Network } from '@capacitor/core';
import Jersey from './Jersey';


const log = getLogger('JerseyList');

const offset = 3;

const JerseyList: React.FC<RouteComponentProps> = ({ history }) => {
  const { logout } = useContext(AuthContext)

  const {items, fetching, fetchingError} = useContext(JerseyContext);
  const [disableInfiniteScroll, setDisabledInfiniteScroll] = useState<boolean>(false);
  const [visibleItems, setVisibleItems] = useState<JerseyProps[] | undefined>([]);
  const [page, setPage] = useState(offset)
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<boolean>(true);

  const {savedOffline} = useContext(JerseyContext);

  
  Network.getStatus().then(status => setStatus(status.connected));

  Network.addListener('networkStatusChange', (status) => {
      setStatus(status.connected);
  })



  const allSports = ["all"];
items?.forEach(e=>allSports.push(e.sport))
const sports = allSports.filter((n, i) => allSports.indexOf(n) === i);


  useEffect(() => {
    if (items?.length && items?.length > 0) {
        setPage(offset);
        fetchData();
        console.log(items);
    }
}, [items]);

useEffect(() => {
  
   if (items && filter) {
     if(filter==="all"){setVisibleItems(items)}
     else{
      setVisibleItems(items.filter(each => each.sport === filter ));}
  }
}, [filter]);

useEffect(() => {
    if (search === "") {
        setVisibleItems(items);
    }
    if (items && search !== "") {
        setVisibleItems(items.filter(each => each.teamName.startsWith(search)));
    }
}, [search])

function fetchData() {
    setVisibleItems(items?.slice(0, page + offset));
    setPage(page + offset);
    if (items && page > items?.length) {
        setDisabledInfiniteScroll(true);
        setPage(items.length);
    } else {
        setDisabledInfiniteScroll(false);
    }
}

async function searchNext($event: CustomEvent<void>) {
    fetchData();
    ($event.target as HTMLIonInfiniteScrollElement).complete();
}

  log('render');
  return (
    <IonPage>
      <IonHeader>
          <IonToolbar>
            <IonItem>
                <IonSelect style={{ width: '40%' }} value={filter} placeholder="Pick a sport" onIonChange={(e) => setFilter(e.detail.value)}>
                    {sports.map((each) => (
                        <IonSelectOption key={each} value={each}>
                                {each}
                        </IonSelectOption>
                    ))}
                </IonSelect>
                <IonSearchbar style={{ width: '50%' }} placeholder="Search by Team Name" value={search} debounce={200} onIonChange={(e) => {
                    setSearch(e.detail.value!);
                }}>
                </IonSearchbar>
                <IonChip>
                  <IonLabel color={status? "success" : "danger"}>{status? "Online" : "Offline"}</IonLabel>
              </IonChip>
            </IonItem> 
          </IonToolbar>
        </IonHeader>
      <IonContent fullscreen>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {
          visibleItems && (
          <IonList>
            {Array.from(visibleItems)
              .filter(each => {
                 if (filter !== undefined && filter !=="all" )  
                    return each.sport === filter && each._id !== undefined;
                      return each._id !== undefined;
              }).map(({ _id, teamName,playerName,playerNumber,jerseyYear,sport,brand,isSigned, latitude, longitude, webViewPath}) =>
              <Jersey key={_id} _id={_id} teamName={teamName} playerName={playerName} playerNumber={playerNumber} jerseyYear={jerseyYear} sport={sport} brand={brand} isSigned={isSigned || false} latitude={latitude} longitude={longitude} webViewPath={webViewPath} onEdit={_id => history.push(`/api/items/jersey/${_id}`)} />)}
          </IonList>
        )
        }
        <IonInfiniteScroll threshold="100px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
            <IonInfiniteScrollContent loadingText="Loading...">
            </IonInfiniteScrollContent>
        </IonInfiniteScroll>
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/api/items/jersey')}>
                <IonIcon icon={add}/>
            </IonFabButton>
        </IonFab>

        <IonFab vertical="bottom" horizontal="start" slot="fixed">
            <IonFabButton onClick={handleLogout}>
                Logout
            </IonFabButton>
        </IonFab>
        <IonToast
            isOpen={savedOffline ? true : false}
            message="Your changes will be visible on server when you get back online!"
                  duration={2000}/>
          </IonContent>
        </IonPage>
  );
  function handleLogout() {
    log("logout");
    logout?.();
}
};

export default JerseyList;
