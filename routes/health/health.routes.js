import express from 'express'
import { getHealthSnapshot } from '../../lib/runtime.js'

export const router = express.Router()

router.get('/', (req, res) => {
    res.json(getHealthSnapshot())
})