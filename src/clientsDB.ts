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
      await db.exec('CREATE TABLE IF NOT EXISTS clients (idCliente INTEGER PRIMARY KEY AUTOINCREMENT, session TEXT UNIQUE, ownerClient INTEGER UNIQUE NULL, establishment INTEGER UNIQUE NULL)')
    }catch{}
  },
  insertDados: async function(session: any){
    var db = await this.openDb()
    
    await db.run('INSERT INTO clients(session) VALUES ($session)', {
      $session:session
    })
  },
  getClients: async function(){
    var db = await this.openDb()
    try{
      const result = await db.all("SELECT session FROM clients")
      return result
    }catch{}
    return null
  }
};
