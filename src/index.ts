import express from 'express'
import siteLists from './api/siteProperties'
import { showGoogleSheets, checkAuthors, checkStories, testing } from './api/workWithGoogleSheets'

const app = express()
app.use(express.json())
const PORT = 3333

app.listen(PORT, () => {
  console.log(`app running on port => ${PORT}`)
})

app.use('/api/sites', siteLists)
app.use('/test/', testing)
app.use('/api/sheets/', checkAuthors, showGoogleSheets, checkStories)
