const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Product = require('../models/product')
const Order = require('../models/order')
const pvtMsg = require('../models/pvtMsg')
const {ensureAuthenticated,ensureGuest} = require('../helper/auth')
const {multerConfigImage} = require('../multer')
const cloud = require('../cloudinaryConfig')
const fs = require('fs')
const path = require('path');
const PDFDocument = require('pdfkit');

router.get('/product/all',ensureAuthenticated,async (req,res) => {
    const person = await User.findById(req.user._id).lean()
    if(person.isAdmin){
        var products = await Product.find().lean() 
    } else {
        var products = await Product.find({shop:person.shop}).lean()
    }
    res.render('products',{person,products})
})

router.post('/product/new',multerConfigImage,async(req,res)=>{
    try {
        const {title,price,desc,qty} = req.body
        const person = await User.findById(req.user._id)
        if(!req.file || !title || !price || !desc || !qty) {
            req.flash('error',"You must fill all options")
            return res.redirect('/product/all')
        }
        const result = await cloud.uploads(req.file.path)
        fs.unlinkSync(req.file.path)
        const newProduct = new Product({title,price,desc,qty,imageUrl: result.url,shop : person.shop})
        await newProduct.save()
        req.flash('error',"Product was added")
        res.redirect('/product/all')
    } catch(err){
        console.log('error',err)
        res.redirect('/product/all')
    }
})

router.get('/exports',ensureAuthenticated,async (req,res)=>{
    const person = await User.findById(req.user._id).lean()
    const orders = await Order.find({from:person.shop}).lean() 
    const products = await Product.find({shop:person.shop}).lean()
    let allCost = 0
    orders.map(order => allCost+= order.cost)
    res.render('exports',{person,orders,allCost,products})
})

router.post('/exports/new',async (req,res) => {
    try {
        const {item , qty , from , to ,userId} = req.body
        if(!item || !qty || !to ) {
            req.flash('error', "you have to fill all options")
            return res.redirect('/exports')
        }
        const product = await Product.findOne({title:item,shop:from})
        if(!product){
            req.flash('error',"This product not available")
            return res.redirect('/exports')
        }
        if(product.qty < qty){
            req.flash('error',`You have only ${product.qty} from ${item}`)
            return res.redirect('/exports')
        }
        product.qty = product.qty - qty
        if(product.qty == 0) {
            await Product.findByIdAndDelete(product._id)
        } else{
            await product.save()
        }
        const newOrder = new Order({item,qty,userId,from,to,cost : product.price * qty})
        await newOrder.save()
        const product2 = await Product.findOne({title:item,shop:to})
        if(product2){
            product2.qty = product2.qty + +qty
            await product2.save()
        }
        req.flash('error',"This order was added")
        return res.redirect('/exports')

    } catch(err){
        console.error(err)
        res.redirect('/exports')
    }
})

router.get('/imports',ensureAuthenticated,async (req,res) => {
    const person = await User.findById(req.user._id).lean()
    const orders = await Order.find({to:person.shop}).lean()
    const products = await Product.find({shop:person.shop}).lean()
    let allCost = 0
    orders.map(order => allCost+= order.cost)
    res.render('imports',{person,orders,allCost,products})
})

router.post('/imports/new',async (req,res)=>{
    try{
        const {item , qty , from , to ,userId} = req.body
        if(!item || !qty || !from ) {
            req.flash('error', "you have to fill all options")
            return res.redirect('/imports')
        }
        var product = await Product.findOne({title:item,shop:to})
        if(!product){ // if product not exist I have to create one 
            req.flash('error',"This product not exist in out stock , please add it first")
            return res.redirect('/imports')
        }
        product.qty = product.qty + +qty
        await product.save()
        const newOrder = new Order({item,qty,userId,from,to,cost : product.price * qty})
        await newOrder.save()
        var product2 = await Product.findOne({title:item,shop:from})
        if(product2){
            product2.qty = product2.qty - qty
            await product2.save()
        }
        req.flash('error',"This order was added")
        return res.redirect('/imports')
    } catch(err){
        console.error(err)
        res.redirect('/imports')
    }
})

router.get('/invoice/:orderId',ensureAuthenticated,async (req,res)=>{
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('userId')
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('invoices',invoiceName);  
        const pdfDoc = new PDFDocument(); // you can add images also , see Docs
        pdfDoc.pipe(fs.createWriteStream(invoicePath));// create file on server on fly
        res.setHeader('Content-Type','application/pdf'); // to deal as pdf
        res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"'); // inline mean open in browser
        pdfDoc.pipe(res); // return our pdf to user which res is writableStream , pdfDoc is readable one
        pdfDoc.fontSize(26).text('Invoice',{ // text write single line
          underline: true
        }); 
        // order.items.forEach(prod => {
        //   pdfDoc.fontSize(14).text(`${prod.productId.title} - qty: ${prod.qty}`)
        //   // console.log(prod.productId);
        // });
        pdfDoc.fontSize(14).text(`${order.item} - qty: ${order.qty}`)
        pdfDoc.text('------------');
        pdfDoc.text(`FROM : ${order.from}`);
        pdfDoc.text(`To: ${order.to}`);
        pdfDoc.text(`cashier: ${order.userId.name}`);
        pdfDoc.text(`Total Price: ${order.cost}`);
        pdfDoc.end();
    } catch(err){
        console.error(err)
        res.redirect('/products/all')
    }
})

router.get('/private/:toName',ensureAuthenticated,async (req,res)=>{
    try {
      var toName = req.params.toName
      var to = await User.findOne({name: toName}).lean()
      const msgs = await pvtMsg.find({ users: { $all: [to._id.toString(), req.user._id.toString()] } }).lean()
      // msgs.map(e => 
      //   e.Date = e.Date.toLocaleTimeString().replace(/:\d+ /, ' ') +' ' + e.Date.toDateString().substr(4)
      // )
      if(req.user){
        const person = await User.findById(req.user._id).lean()
        res.render('private',{person,toName,toId:to._id,msgs})
    } else {
      res.render('private')
    }
    } catch(err){
      res.redirect('/product/all')
    }
    
  })

router.get('/users',ensureAuthenticated,async (req,res)=>{
    try{
        var users = await User.find().lean()
        users = users.filter(e => e._id.toString() != req.user._id.toString())
        const person = await User.findById(req.user._id).lean()
        res.render('users',{users,person})

    } catch(err){
        console.log(err)
    }
})

module.exports = router