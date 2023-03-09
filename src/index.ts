import express from 'express'
import siteLists from './api/siteProperties'
import { testing } from './api/testing'
import { showGoogleSheets, checkAuthors, checkStories } from './api/googleSheet'
import { searchPosibilitiesURL } from './api/searchByUrl'

const app = express()
app.use(express.json())
const PORT = process.env.SANDBOX === 'dev'? 4444 : 3333

app.listen(PORT, () => {
  console.log(`app running on port => ${PORT}`)
})

app.use('/api/sheets/', checkAuthors, showGoogleSheets, checkStories)
app.use('/api/url/', searchPosibilitiesURL)
app.use('/api/sites', siteLists)
app.use('/test/', testing)

