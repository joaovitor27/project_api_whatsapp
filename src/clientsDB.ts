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
    try{
      await db.exec('CREATE TABLE IF NOT EXISTS clients (session TEXT UNIQUE PRIMARY KEY)')
      await db.exec('CREATE TABLE IF NOT EXISTS resales (ownersession INTEGER,establishment INTEGER,' + 
                    'sessionResales TEXT, FOREIGN KEY(sessionResales) REFERENCES clients(session))')

    }catch{}
  },
  insertDados: async function(session: any, client: any, callback:any){
    var db = await this.openDb()

    await db.run('INSERT INTO clients(session) VALUES ($session)', {
      $session:session
    })
  },
  getClients: async function(){
    var db = await this.openDb()
    const result = await db.all("SELECT session FROM clients")
    return result
  }
};
