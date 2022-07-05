import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
sqlite3.verbose()


module.exports = {
  openDb : async function() {
    return open({
      filename: './clients.db',
      driver: sqlite3.Database
    })
  },
  crateTable: async function(callback:any){
    var db = await this.openDb()
    await db.exec('CREATE TABLE clients (session TEXT, cliente TEXT)')
  },
  insertDados: async function(session: any, client: any, callback:any){
    var db = await this.openDb()
    console.log("teste/; ",client)
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (_key: any, value: object | null) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
    var clientjson = JSON.stringify(client, getCircularReplacer())
    await db.run('INSERT INTO clients(sessionclient, client) VALUES ($session, $client)', {
      $session:session,
      $client:clientjson
    })
  },
  getClient: async function(session:String){
    console.log(session)
    var db = await this.openDb()
    const result = await db.get("SELECT client FROM clients WHERE sessionclient = $sessionclient", {$sessionclient:session}) 
    var json = JSON.parse(result.client)
    return json
  }
};
