'use strict';
// Bound this separately requested change to exact bytes, preserving all older pins.
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const BASE='318f987';
const BASE_HASH='f0cd7b156d5302362be3d22f66170aa8d026070b83947c39a51a31d5842e94b8';
const CANDIDATE_HASH='2e7d49fb889b078c942ed37058dbc8f01b0900782ba83d57446c5976f8bf7097';
const hash=x=>createHash('sha256').update(x).digest('hex');
function normalize(root,candidate){
  if(hash(candidate)!==CANDIDATE_HASH)throw Error('unapproved-invoice-recovery-revision');
  const base=execFileSync('git',['--no-replace-objects','-C',root,'cat-file','blob',BASE+':index.html'],{maxBuffer:1024*1024}).toString('utf8');
  if(hash(base)!==BASE_HASH)throw Error('invoice-recovery-base-mismatch');
  let current=candidate.toString('utf8');
  for(const [begin,end]of [
    ['<body>','<script'],
    ['function nav(pg) {','function renderDashboard() {'],
    ['function saveSaleInvoice(andPrint) {','function editInvoice() {'],
    ['function clearAllData(){','function closeModal(id)'],
    ['window.withDeletePin = ','window.delInvoiceSafe = ']
  ]){
    const a=current.indexOf(begin),b=current.indexOf(end,a+begin.length),c=base.indexOf(begin),d=base.indexOf(end,c+begin.length);
    if(a<0||b<a||c<0||d<c)throw Error('invoice-recovery-region-missing');
    current=current.slice(0,a)+base.slice(c,d)+current.slice(b);
  }
  current=current.replace("if(e.key==='n'){e.preventDefault();startNewInvoice();}","if(e.key==='n'){e.preventDefault();nav('new-sale');}")
    .replace('onclick="startNewInvoice();closeModal(\'party-detail-modal\')','onclick="nav(\'new-sale\');closeModal(\'party-detail-modal\')');
  if(current!==base)throw Error('change-outside-invoice-recovery-regions');
  return Buffer.from(current);
}
module.exports={normalize,CANDIDATE_HASH};
