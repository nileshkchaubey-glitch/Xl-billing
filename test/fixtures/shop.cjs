function shop(n=50){
 const settings={shopName:'Synthetic XL Shop',prefix:'INV-',invNo:1001+n,fy:'2026-27',terms:'',bank:'',customFields:[],modules:{packing:true,dispatch:true,retail:true,gst:true}};
 const parties=[{id:'p1',name:'Synthetic Customer',phone:'9876543210',type:'both',openingBal:0},{id:'p2',name:'Synthetic Supplier',type:'supplier',openingBal:0}];
 const items=[{id:'i1',name:'Paper Cups',unit:'Pcs',saleRate:20,purchaseRate:10,gst:5},{id:'i2',name:'Plates',unit:'Pcs',saleRate:30,purchaseRate:15,gst:12}];
 const invoices=Array.from({length:n},(_,i)=>({id:'s'+i,invoiceNo:'INV-'+(1001+i),date:'2026-10-09',partyId:'p1',partyName:'Synthetic Customer',items:[{id:'line'+i,itemId:'i1',name:'Paper Cups',qty:5,rate:20,amt:100,unit:'Pcs'}],subtotal:100,discount:0,taxPct:0,taxAmt:0,total:100,paid:20,balance:80,notes:'',paymentType:'Credit',dispatchStatus:'pending',payments:[{date:'2026-10-09',amt:20,mode:'Cash',note:''}],createdAt:'2026-10-09T08:00:00Z'}));
 const purchases=[{id:'u1',date:'2026-10-09',partyId:'p2',partyName:'Synthetic Supplier',billNo:'P-1',mode:'amount',total:500,paid:20,balance:480,items:[],notes:'',payments:[{date:'2026-10-09',amt:20,mode:'Cash',note:''}],createdAt:'2026-10-09T08:00:00Z'}];
 return {settings,parties,items,invoices,purchases,retail:[{id:'r1',date:'2026-10-09',amount:50,notes:''}],audit:[]};
}
module.exports={shop};
