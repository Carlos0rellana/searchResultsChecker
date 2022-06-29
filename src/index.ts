import express from 'express'
import siteLists from './api/siteProperties'
import { showGoogleSheets, proccessAuthors } from './api/workWithGoogleSheets'

const app = express()
app.use(express.json())
const PORT = 3333

app.listen(PORT, () => {
  console.log(`app running on port => ${PORT}`)
})

app.use('/api/sites', siteLists)
app.use('/api/sheets/', proccessAuthors, showGoogleSheets)
