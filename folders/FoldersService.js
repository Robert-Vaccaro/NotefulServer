const FoldersService = {
    // plural
    getAllFolders(knex) {
      return knex.select('*').from('folders')
    },
  
    //single
    insertFolder(knex, newComment) {
      return knex
        .insert(newComment)
        .into('folders')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
  
    getById(knex, id) {
      return knex
        .from('folders')
        .select('*')
        .where('id', id)
        .first()
    },
  
    deleteFolder(knex, id) {
      return knex('folders')
        .where({ id })
        .delete()
    },
  
    updateFolder(knex, id, newFolderFields) {
      return knex('folders')
        .where({ id })
        .update(newFolderFields)
    },
  }
  
  module.exports = FoldersService