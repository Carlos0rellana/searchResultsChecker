import express from 'express'
import { getAsyncWebGrammarly } from '../subscribers/grammarly'

export const testing = express.Router()

testing.get('/checkspells/:phrase', (req, res) => {
    const values = getAsyncWebGrammarly(decodeURI(req.params.phrase))
    res.send(values)
})