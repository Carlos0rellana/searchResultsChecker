import express from 'express'
import { getSiteList } from '../services/getSitesPropierties'

const siteLists = express.Router()

siteLists.get('/', (_req, res) => {
  res.send(getSiteList())
})

export default siteLists
