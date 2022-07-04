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
    // await db.exec('CREATE TABLE clients (session TEXT, cliente TEXT)')
  },
  insertDados: async function(session: any, client: any, callback:any){

    // await db.run('INSERT INTO clients(session, cliente) VALUES ($session, $client)', {
    //   $session:session,
    //   $client:client
    // })
  },
  getClient: async function(session:Number){
    console.log(session)
    var db = await this.openDb()
    const result = await db.get("SELECT client FROM clients WHERE sessionclient = 5586995177507") 
    console.log(result)
    return result
  }
};
