// @ts-ignore
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'

sqlite3.verbose()


module.exports = {
    openDb: async function () {
        return open({
            filename: './clients.db',
            driver: sqlite3.Database
        })
    },
    crateTable: async function () {
        let db = await this.openDb();
        try {
            await db.exec('CREATE TABLE IF NOT EXISTS clients (idCliente INTEGER PRIMARY KEY AUTOINCREMENT, session TEXT UNIQUE, ownerClient INTEGER UNIQUE NULL, establishment INTEGER UNIQUE NULL)')
        } catch {
        }
    },
    insertData: async function (session: any) {
        let db = await this.openDb();
        try {
            await db.run('INSERT INTO clients(session) VALUES ($session)', {
                $session: session
            })
        } catch {
        }
    },
    getClients: async function () {
        let db = await this.openDb();
        try {
            return await db.all("SELECT session FROM clients")
        } catch {
        }
        return null
    },
    getClient: async function (session: any) {
        let db = await this.openDb();
        return await db.get("SELECT ownerClient, establishment from clients WHERE session = $session", {
            $session: session
        })
    },
    updateSession: async function (session: any, owner: any, establishment: any) {
        let db = await this.openDb();
        try {
            return await db.get("UPDATE clients SET ownerClient = $owner, establishment = $establishment WHERE session = $session", {
                $session: session,
                $establishment: establishment,
                $owner: owner
            })
        } catch (e) {
            return e
        }
    },
    deleteSession: async function (session: any) {
        let db = await this.openDb();
        try {
            return await db.get("DELETE FROM clients WHERE session = $session", {
                $session: session
            })
        } catch (e) {
            return e
        }
    }
};
