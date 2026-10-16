import express from 'express'
import { paymentFailure, paymentSuccess, payPage } from '../controller/esewaController.js';


export const esewaRoutes = express.Router();

esewaRoutes.get("/pay/:orderNumber", payPage);
esewaRoutes.get("/success", paymentSuccess);
esewaRoutes.get("/failure", paymentFailure);

export default esewaRoutes;
