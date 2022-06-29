import express from 'express'
import asyncHandler from 'express-async-handler'
import { getUrlsFromSheets, checkAuthorInOutput } from '../services/getRowsFromSheets'

export const showGoogleSheets = express.Router()
export const proccessAuthors = express.Router()

proccessAuthors.get('/:documentID/authors', asyncHandler(async (req, res) => {
  const values = await checkAuthorInOutput(req.params.documentID, true)
  res.send(values)
}))

showGoogleSheets.get('/:documentID', asyncHandler(async (req, res) => {
  const values = await getUrlsFromSheets(req.params.documentID)
  res.send(values)
}))
