import { app } from 'electron';
import { readdirSync, unlinkSync, statSync } from 'fs';
const Database = require('better-sqlite3');
console.log(app.getPath('userData'));
let db = new Database((app.getPath('userData') + '/nova.db'));

db.prepare('create table if not exists Faturas(id INTEGER PRIMARY KEY, timestamp INTEGER, vtr TEXT, lt FLOAT, odometer INTEGER, price FLOAT)').run()
db.prepare('create table if not exists FaturasTemp(id INTEGER PRIMARY KEY, timestamp INTEGER, vtr TEXT, lt FLOAT, odometer INTEGER, price FLOAT)').run()
db.prepare('create table if not exists VTR(id INTEGER PRIMARY KEY, vtr TEXT, placa TEXT)').run()

/**
 * @returns Array of objects from table Faturas
 */
function getCombustivel() {
      const result = db.prepare('select * from Faturas').all()
      return result
}

/**
 * @returns Array of objects from table VTR
 */
function getVTR() {
      const query = db.prepare('select * from VTR')
      const result = query.all()
      return result
}

/**
 * @returns Array of objects from table FaturasTemp then delete
 */
function getFaturasTemp() {
      const result = db.prepare('select * from FaturasTemp').all()
      db.prepare('delete from FaturasTemp').run()
      return result
}

/**
 * @param { Array } data [ {timestamp, vtr, lt, odometer, price} ]
 */
function insertFaturas(data) {
      data = data
      const insert = db.prepare('insert into Faturas (timestamp, vtr, lt, odometer, price) values (@timestamp, @vtr, @lt, @odometer, @price)');
      const insertMany = db.transaction((data) => {
            for (const item of data) insert.run(item);
      });
      insertMany(data);
}

/**
 * @param { Array } data [ {timestamp, vtr, lt, odometer, price} ]
 */
function insertFaturasTemp(data) {
      const insert = db.prepare('insert into FaturasTemp (timestamp, vtr, lt, odometer, price) values (@timestamp, @vtr, @lt, @odometer, @price)');
      const insertMany = db.transaction((data) => {
            for (const item of data) insert.run(item);
      });
      insertMany(data);
}

/**
 * @param { Array } data [ {vtr, placa} ]
 */
function insertVTR(data, many) {
      data = data
      if (many) {
            db.prepare('delete from VTR').run()
            const insert = db.prepare('insert into VTR (vtr, placa) values (@vtr, @placa)');
            const multiQuery = db.transaction((data) => {
                  for (const item of data) insert.run(item);
            });
            multiQuery(data);
      }
      else {
            const insert = db.prepare('insert into VTR (vtr, placa) values (@vtr, @placa)')
            insert.run(data)
      }
}

/**
 * @param { Array } data [ {timestamp, vtr, lt, odometer, price} ]
 */
function updateFaturas(oldItem, newItem, type) {
      oldItem = oldItem
      newItem = newItem
      if (type == 'migrar') {
            const update = db.prepare('update Faturas set vtr = ? where vtr = ?');
            update.run(newItem.vtr, oldItem.vtr)
      }
      else {
            const update = db.prepare('update Faturas set timestamp = ?, vtr = ?, lt = ?, odometer = ?, price = ? where id = ?');
            update.run(newItem.timestamp, newItem.vtr, newItem.lt, newItem.odometer, newItem.price, oldItem.id)
      }

}

/**
 * @param { Array } data [ {vtr, placa} ]
 */
function updateVTR(oldItem, newItem) {
      oldItem = oldItem
      newItem = newItem
      const update = db.prepare('update VTR set vtr = ?, placa = ? where id = ?');
      update.run(newItem.vtr, newItem.placa, oldItem.id)
}

/**
 * @param { string } table 
 * @param { Array } items [ {id} ]
 */
function deleteEntry(table, items) {
      try {
            const multiQuery = db.transaction((data) => {
                  for (const item of data)
                        db.prepare(`delete from ${table} where id = ?`).run(item.id)
            })
            multiQuery(items)
      } catch (error) {
            console.log(error);
      }
}

function backupExport(filePath) {
      let regex = new RegExp(filePath.slice(-23, -14))
      let path = filePath.slice(0, -23)
      deleteObsoleteBackup(regex, path)
      db.backup(filePath)
            .then(() => console.log('backup complete!'))
            .catch((err) => console.log('backup failed:', err));
}

function importBackup(filePath) {
      console.log(filePath);
      db = new Database(filePath)
}

function getDBDate() {
      const stats = statSync(app.getPath('userData') + '/nova.db');
      return Date.parse(stats.mtime)
}

function deleteObsoleteBackup(regex, path) {
      readdirSync(path)
            .filter(file => regex.test(file))
            .map(file => {
                  console.log(`${path}/${file}`);
                  return unlinkSync(`${path}/${file}`);
            })
}

function deleteDBTable(table) {
      const deleteTable = db.prepare(`delete from ${table}`)
      deleteTable.run()
}

function close() {
      db.close();
}

export default {
      getCombustivel, getVTR, getFaturasTemp, insertFaturas,
      insertVTR, insertFaturasTemp, deleteEntry, updateFaturas,
      updateVTR, backupExport, importBackup, getDBDate,
      deleteDBTable, close
}