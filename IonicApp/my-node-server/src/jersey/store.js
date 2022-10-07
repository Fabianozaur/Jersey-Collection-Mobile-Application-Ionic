import dataStore from 'nedb-promise';

export class JerseyStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }
  
  async find(props) {
    return this.store.find(props);
  }
  
  async findOne(props) {
    return this.store.findOne(props);
  }
  
  async insert(jersey) {
    return this.store.insert(jersey);
  };
  
  async update(props, jersey) {
    return this.store.update(props, jersey);
  }
  
  async remove(props) {
    return this.store.remove(props);
  }
}

export default new JerseyStore({ filename: './db/jerseys.json', autoload: true });