import express from 'express'
import asyncHandler from 'express-async-handler'
import { searchByUrl } from '../services/search/searchAllPlacesUrls'

export const searchPosibilitiesURL = express.Router()

searchPosibilitiesURL.get('/*', asyncHandler(async (req, res) => {
  const values = await searchByUrl(req.params[0])
  // console.log('La ruta a buscar: ==>',req.params[0])
  res.send(values)
}))
