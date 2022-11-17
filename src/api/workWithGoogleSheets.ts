import express from 'express'
import asyncHandler from 'express-async-handler'
import { checkUrlsStatusFromSheets } from '../services/getHttpAndTypesOfUrl'
import { checkAuthorInOutput, check404inGoogle, checkRedirectsFromSheets, checkByDatesFromSheets, checkTagsFromSheets, checkUrlInDBFromSheets, checkUrlInGoogleFromSheets, checkUrlInArcRedirectsFromSheets, checkTagInArcFromSheets, checkUrlInArcCirculateFromSheets, checkUrlInArcRedirectsFromSheetsWhenIsFoundInOtherUrl } from '../services/checkingDataFromSheets'
import { deleteRedirectsFromSheets, proccessRedirectsFromSheets, proccessTagsFromSheets } from '../services/processDataFromSheets'

export const showGoogleSheets = express.Router()
export const checkAuthors = express.Router()
export const checkStories = express.Router()

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

checkStories.get('/:documentID/search/metro', asyncHandler(async (req, res) => {
  const values = await checkUrlInDBFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/search/google', asyncHandler(async (req, res) => {
  const values = await checkUrlInGoogleFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/search/sitemaps', asyncHandler(async (req, res) => {
  const values = await checkByDatesFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/search/redirects', asyncHandler(async (req, res) => {
  const values = await checkUrlInArcRedirectsFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/search/tags', asyncHandler(async (req, res) => {
  const values = await checkTagInArcFromSheets(req.params.documentID)
  res.send(values)
}))

checkStories.get('/:documentID/search/circulate', asyncHandler(async (req, res) => {
  const values = await checkUrlInArcCirculateFromSheets(req.params.documentID)
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
  const values = await checkUrlInArcRedirectsFromSheetsWhenIsFoundInOtherUrl(req.params.documentID)
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
