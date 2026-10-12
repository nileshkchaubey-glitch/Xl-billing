'use strict';
// Synthetic shapes derived from the historical standalone app, never owner data.
const openingInvoice={id:'legacy-sale',invoiceNo:'INV-7',date:'2024-01-04',partyId:'p1',partyName:'Synthetic Customer',total:100,paid:20,balance:80,items:[],paymentType:'Credit'};
const discountedPurchase={id:'legacy-purchase',billNo:'P-7',date:'2024-01-04',partyId:'p2',partyName:'Synthetic Supplier',total:500,paid:20,discount:10,discounts:[{date:'2024-01-04',amt:10,note:'Synthetic discount'}],balance:470,payments:[{date:'2024-01-04',amt:20,mode:'Cash'}]};
const conflictInvoice={...openingInvoice,paid:50,balance:50,payments:[{date:'2024-01-04',amt:20,mode:'Cash'}]};
module.exports={openingInvoice,discountedPurchase,conflictInvoice};
