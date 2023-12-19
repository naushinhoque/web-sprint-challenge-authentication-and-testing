const db = require('../../data/dbConfig');

function add(user) {
  return db('users').insert(user, 'id').then(([id]) => findById(id));
}

function findBy(filter) {
  return db('users').where(filter);
}

function findById(id) {
  return db('users').where({ id }).first();
}

module.exports = {
  add,
  findBy,
  findById,
};