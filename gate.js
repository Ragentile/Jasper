'use strict';
const form=document.getElementById('unlock-form');
const input=document.getElementById('password');
const submit=form.querySelector('.submit');
const status=document.getElementById('status');
const reveal=form.querySelector('.reveal');
reveal.addEventListener('click',()=>{
  const visible=input.type==='password';input.type=visible?'text':'password';
  reveal.textContent=visible?'隐藏':'显示';reveal.setAttribute('aria-pressed',String(visible));reveal.setAttribute('aria-label',visible?'隐藏密码':'显示密码');
});
const bytes=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
let pending=false;
form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending)return;
  if(!window.crypto || !window.crypto.subtle){status.textContent='请使用最新版 Safari、Chrome 或 Edge 打开此 HTTPS 网址。';return;}
  pending=true;submit.disabled=true;status.textContent='正在打开文章…';
  try{
    const response=await fetch('./article.enc.json',{cache:'no-store'});
    if(!response.ok)throw new Error('network');
    const payload=await response.json();
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:bytes(payload.salt),iterations:payload.iterations},material,{name:'AES-GCM',length:256},false,['decrypt']);
    let plaintext;
    try{plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv),additionalData:new TextEncoder().encode('jasper-readonly-v1'),tagLength:128},key,bytes(payload.ciphertext));}
    catch(decryptionError){status.textContent='密码不正确，请重新输入。';input.setAttribute('aria-invalid','true');input.focus();input.select();return;}
    input.value='';
    const html=new TextDecoder('utf-8',{fatal:true}).decode(plaintext);
    document.open();document.write(html);document.close();window.scrollTo(0,0);
  }catch(error){status.textContent='暂时无法打开，请检查网络后重试。';}
  finally{pending=false;submit.disabled=false;}
});
input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');status.textContent='';});
