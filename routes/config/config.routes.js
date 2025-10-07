import express from "express";
import { body, validationResult } from "express-validator";

export const router = express.Router();


const schema = [body('port').not().isEmpty().withMessage('Please select a device before continuing')]


router.post('/config', (req, res) => {
    console.log(req.body)
    res.send('OK')
})