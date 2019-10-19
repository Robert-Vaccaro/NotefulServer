const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./FoldersService')

const FoldersRouter = express.Router()
const jsonParser = express.json()

// look into this serialize function - why ({})
const serializefolder = folder => ({
  id: folder.id,
  title: xss(folder.title),
  date_created: folder.date_created,
})

FoldersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
   FoldersService.getAllFolders(knexInstance)
      .then(Folder => {
        res.json(Folder.map(serializefolder))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, date_created } = req.body
    const newfolder = { title, date_created }

    for (const [key, value] of Object.entries(newfolder))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

   

   FoldersService.insertFolder(
      req.app.get('db'),
      newfolder
    )
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializefolder(folder))
      })
      .catch(next)
  })

FoldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
   FoldersService.getById(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `folder doesn't exist` }
          })
        }
        res.folder = folder
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializefolder(res.folder))
  })
  .delete((req, res, next) => {
   FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, date_created } = req.body
    const folderToUpdate = { title, date_created }

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'text' or 'date_noteed'`
        }
      })
    

   FoldersService.updateFolder(
      req.app.get('db'),
      req.params.folder_id,
      folderToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports =FoldersRouter