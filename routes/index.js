var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

var dataBike = [
  {name:"BIK045", url:"/images/bike-1.jpg", price:679, mea: true, shipNotPossible:"express"},
  {name:"ZOOK07", url:"/images/bike-2.jpg", price:999, mea: false, shipNotPossible:""},
  {name:"TITANS", url:"/images/bike-3.jpg", price:799, mea: true, shipNotPossible:"relay"},
  {name:"CEWO", url:"/images/bike-4.jpg", price:1300, mea: false, shipNotPossible:""},
  {name:"AMIG039", url:"/images/bike-5.jpg", price:479, mea: true, shipNotPossible:"relay"},
  {name:"LIK099", url:"/images/bike-6.jpg", price:869, mea: false, shipNotPossible:""},
]

var stripe = require('stripe')(`${process.env.STRIPE_API_KEY}`);
var panier = [];


/* GET home page. */

router.get('/', function(req, res, next) {
  if(req.session.dataCardBike == undefined){
    req.session.dataCardBike = []
  }
  
  res.render('index', {dataBike:dataBike});
});

/* GET shop page. */

router.get('/shop', async function(req, res, next) {
  var alreadyExist = false;

  if(req.session.shipping == undefined){
    req.session.shipping = "standard";
  }

  for(var i = 0; i< req.session.dataCardBike.length; i++){
    if(req.session.dataCardBike[i].name == req.query.bikeNameFromFront){
      req.session.dataCardBike[i].quantity = Number(req.session.dataCardBike[i].quantity) + 1;
      alreadyExist = true;
    }
  }

  if(alreadyExist == false){
    req.session.dataCardBike.push({
      name: req.query.bikeNameFromFront,
      url: req.query.bikeImageFromFront,
      price: req.query.bikePriceFromFront,
      quantity: 1,
      shippingNotPossible: req.query.shippingNotPossible
    })
  }
  
  for(var i=0; i<req.session.dataCardBike.length; i++) {
    panier.push({
    name: req.session.dataCardBike[i].name,
    amount: req.session.dataCardBike[i].price*100,
    currency: 'eur',
    quantity: req.session.dataCardBike[i].quantity,
    })
  }

  if(panier.length > 0) {
    var session = await stripe.checkout.sessions.create(
      {
        success_url: `${process.env.HOST}confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.HOST}`,
        payment_method_types: ['card'],
        line_items: panier
      }
    );
    var sessionStripeID = session.id;
  }

  res.render('shop', {dataCardBike:req.session.dataCardBike, sessionStripeID: sessionStripeID, shipping: req.session.shipping});
});

/* GET delete-shop page. */

router.get('/delete-shop', async function(req, res, next){
  req.session.dataCardBike.splice(req.query.position,1)

  if(panier.length > 0) {
    var session = await stripe.checkout.sessions.create(
      {
        success_url: `${process.env.HOST}confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.HOST}`,
        payment_method_types: ['card'],
        line_items: panier
      }
    );
    var sessionStripeID = session.id;
  }

  res.render('shop', {dataCardBike:req.session.dataCardBike, sessionStripeID: sessionStripeID, shipping: req.session.shipping});
})

/* GET update-shop page. */

router.post('/update-shop', async function(req, res, next){
  var position = req.body.position;
  var newQuantity = req.body.quantity;
  req.session.dataCardBike[position].quantity = newQuantity;
  
  if(panier.length > 0) {
    var session = await stripe.checkout.sessions.create(
      {
        success_url: `${process.env.HOST}confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.HOST}`,
        payment_method_types: ['card'],
        line_items: panier
      }
    );
    var sessionStripeID = session.id;
  }

  res.render('shop', {dataCardBike:req.session.dataCardBike, sessionStripeID: sessionStripeID, shipping: req.session.shipping});
})

/* GET confirm page. */

router.get('/confirm', function(req, res, next) {
  res.render('confirm', {dataBike:dataBike});
});

/* GET shipping-shop page. */

router.get('/shipping-shop', async function(req, res, next) {
  if(req.query.shippingMode != undefined) {
    req.session.shipping = req.query.shippingMode;
  } 
  
  if(panier.length > 0) {
    var session = await stripe.checkout.sessions.create(
      {
        success_url: `${process.env.HOST}confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.HOST}`,
        payment_method_types: ['card'],
        line_items: panier
      }
    );
    var sessionStripeID = session.id;
  }
  
  res.render('shop', {dataCardBike:req.session.dataCardBike, sessionStripeID: sessionStripeID, shipping: req.session.shipping});
});


module.exports = router;
