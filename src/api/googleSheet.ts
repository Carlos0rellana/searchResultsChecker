import express from 'express'
import asyncHandler from 'express-async-handler'
import { checkUrlsStatusFromSheets } from '../services/getHttpAndTypesOfUrl'
import { checkAuthorInOutput } from '../services/search/servicesArcAuthor'
import { deleteRedirectsFromSheets, proccessRedirectsFromSheets, proccessTagsFromSheets } from '../services/processDataFromSheets'
import { checkRedirectsFromSheets, searchAndUpdateRedirectsInSheets, searchAndUpdateExternalRedirectsInSheets } from '../services/search/servicesArcRedirects'
import { searchAndUpdateTagInSheets, checkTagsFromSheets } from '../services/search/servicesArcTags'
import { searchAndUpdatePosibilitiesInSheets } from '../services/search/servicesCompleteSearchUrls'
import { check404inGoogle, searchAndUpdateGoogleInSheets } from '../services/search/servicesGoogleSearch'
import { searchAndUpdateMetroInSheets } from '../services/search/servicesMetroSearch'
import { searchAndUpdateCirculateInSheets } from '../services/search/servicesArcCirculate'
import { searchAndUpdateSitemapsInSheets } from '../services/search/servicesArcSitemaps'

export const showGoogleSheets = express.Router()
export const checkAuthors = express.Router()
export const checkStories = express.Router()

const searchUrl = '/:documentID/search/'

// sección de busquedas
checkStories.get(`${searchUrl}metro`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateMetroInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}google`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateGoogleInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}sitemaps`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateSitemapsInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}redirects`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateRedirectsInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}tags`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateTagInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}circulate`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdateCirculateInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get(`${searchUrl}all`, asyncHandler(async (req, res) => {
  const values = await searchAndUpdatePosibilitiesInSheets(req.params.documentID)
  res.send(values)
}))




checkAuthors.get('/:documentID/check/authors', asyncHandler(async (req, res) => {
  const values = await checkAuthorInOutput(req.params.documentID, true)
  res.send(values)
}))

checkStories.get('/:documentID/check/stories', asyncHandler(async (req, res) => {
  const values = await check404inGoogle(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/check/redirects', asyncHandler(async (req, res) => {
  const values = await checkRedirectsFromSheets(req.params.documentID)
  res.send(values)
}))


checkStories.get('/:documentID/check/tags', asyncHandler(async (req, res) => {
  const values = await checkTagsFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/process/redirects', asyncHandler(async (req, res) => {
  const values = await proccessRedirectsFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/process/redirects/circulate', asyncHandler(async (req, res) => {
  const values = await searchAndUpdateExternalRedirectsInSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/process/tags', asyncHandler(async (req, res) => {
  const values = await proccessTagsFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/delete/redirects', asyncHandler(async (req, res) => {
  const values = await deleteRedirectsFromSheets(req.params.documentID)
  res.send(values)
}))

showGoogleSheets.get('/:documentID', asyncHandler(async (req, res) => {
  const values = await checkUrlsStatusFromSheets(req.params.documentID)
  res.send(values)
}))


