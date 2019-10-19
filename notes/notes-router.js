const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesService = require('./NotesService')

const NotesRouter = express.Router()
const jsonParser = express.json()

// look into this serialize function - why ({})
const serializenote = note => ({
  id: note.id,
  title: xss(note.title),
  content: xss(note.content),
  date_published: note.date_published,
  folder:note.folder,
})

NotesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    NotesService.getAllNotes(knexInstance)
      .then(Notes => {
        res.json(Notes.map(serializenote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, date_published, folder} = req.body
    const newNote = { title,content, date_published, folder }

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializenote(note))
      })
      .catch(next)
  })

NotesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `note doesn't exist` }
          })
        }
        res.note = note
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializenote(res.note))
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, date_published, folder} = req.body
    const noteToUpdate = { title,content, date_published,folder }

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title' or 'content'`
        }
      })

    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = NotesRouter