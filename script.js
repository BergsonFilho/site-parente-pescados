// script.js - lógica front-end da loja
document.addEventListener('DOMContentLoaded', ()=> {
  // produtos mock
  const products = [
    {id:1,name:'Salmão Inteiro KG',price:65.99,img:'assets/salmao-inteiro.png'},
    {id:2,name:'Filé de salmão KG',price:89.99,img:'assets/file-de-salmao.png'},
    {id:3,name:'Camarão KG',price:25.99,img:'assets/camarao-inteiro.png'},
    {id:4,name:'Tilápia inteira KG',price:15.99,img:'assets/tilapia-inteira.png'}
  ];
  const productsGrid = document.getElementById('productsGrid');
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckout = document.getElementById('closeCheckout');
  const checkoutAmount = document.getElementById('checkoutAmount');
  const checkoutForm = document.getElementById('checkoutForm');
  const paymentMessage = document.getElementById('paymentMessage');

  // carrinho em memória (salva em localStorage)
  let cart = JSON.parse(localStorage.getItem('mf_cart')||'[]');

  // helper: formatar preço
  const money = v => v.toFixed(2);

  // renderiza lista de produtos
  function renderProducts(){
    productsGrid.innerHTML = '';
    products.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <div class="title">${p.name}</div>
        <div class="price">R$ ${money(p.price)}</div>
        <div class="actions">
          <button class="details">Detalhes</button>
          <button class="buy" data-id="${p.id}">Adicionar</button>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  // atualiza contador e total
  function updateCartUI(){
    const total = cart.reduce((s,i)=>s + i.price * i.qty,0);
    const count = cart.reduce((s,i)=>s + i.qty,0);
    cartCount.textContent = count;
    cartTotalEl.textContent = money(total);
    checkoutAmount.textContent = money(total);
    localStorage.setItem('mf_cart',JSON.stringify(cart));
  }

  // renderiza itens no modal do carrinho
  function renderCartItems(){
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){
      cartItemsEl.innerHTML = '<p>Carrinho vazio</p>';
      return;
    }
    cart.forEach(item=>{
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <div class="info">
          <div class="title">${item.name}</div>
          <div class="price">R$ ${money(item.price)} x ${item.qty}</div>
        </div>
        <div class="qty">
          <button class="minus" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button class="plus" data-id="${item.id}">+</button>
          <button class="remove" data-id="${item.id}">Remover</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });
  }

  // adicionar produto ao carrinho
  function addToCart(id){
    const p = products.find(x=>x.id===id);
    const existing = cart.find(x=>x.id===id);
    if(existing) existing.qty++;
    else cart.push({...p,qty:1});
    renderCartItems(); updateCartUI();
  }

  // alterar quantidade
  function changeQty(id,delta){
    const item = cart.find(x=>x.id===id);
    if(!item) return;
    item.qty += delta;
    if(item.qty < 1) cart = cart.filter(x=>x.id!==id);
    renderCartItems(); updateCartUI();
  }

  // remover item
  function removeItem(id){
    cart = cart.filter(x=>x.id!==id);
    renderCartItems(); updateCartUI();
  }

  // eventos globais
  productsGrid.addEventListener('click', e=>{
    if(e.target.matches('.buy')) addToCart(Number(e.target.dataset.id));
  });

  cartItemsEl.addEventListener('click', e=>{
    if(e.target.matches('.plus')) changeQty(Number(e.target.dataset.id),1);
    if(e.target.matches('.minus')) changeQty(Number(e.target.dataset.id),-1);
    if(e.target.matches('.remove')) removeItem(Number(e.target.dataset.id));
  });

  cartBtn.addEventListener('click', ()=> {
    cartModal.setAttribute('aria-hidden','false');
    renderCartItems();
    updateCartUI();
  });
  closeCart.addEventListener('click', ()=> cartModal.setAttribute('aria-hidden','true'));

  checkoutBtn.addEventListener('click', ()=> {
    if(cart.length===0){ alert('Carrinho vazio'); return; }
    checkoutModal.setAttribute('aria-hidden','false');
    checkoutAmount.textContent = cart.reduce((s,i)=>s + i.price*i.qty,0).toFixed(2);
  });
  closeCheckout.addEventListener('click', ()=> checkoutModal.setAttribute('aria-hidden','true'));

  // máscara simples para número do cartão e expiracao
  const cardNumber = document.getElementById('cardNumber');
  const cardExpiry = document.getElementById('cardExpiry');
  if(cardNumber){
    cardNumber.addEventListener('input', e=>{
      let v = e.target.value.replace(/\D/g,'').slice(0,16);
      v = v.replace(/(\d{4})/g,'$1 ').trim();
      e.target.value = v;
    });
  }
  if(cardExpiry){
    cardExpiry.addEventListener('input', e=>{
      let v = e.target.value.replace(/\D/g,'').slice(0,4);
      if(v.length>2) v = v.slice(0,2) + '/' + v.slice(2);
      e.target.value = v;
    });
  }

  // Luhn check simples
  function luhnCheck(num){
    const digits = num.replace(/\s+/g,'').split('').reverse().map(d=>parseInt(d,10));
    let sum = 0;
    for(let i=0;i<digits.length;i++){
      let d = digits[i];
      if(i%2===1){ d*=2; if(d>9) d-=9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  // processar pagamento (simulado)
  checkoutForm.addEventListener('submit', e=>{
    e.preventDefault();
    paymentMessage.textContent = '';
    const name = document.getElementById('cardName').value.trim();
    const number = document.getElementById('cardNumber').value.trim();
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvc = document.getElementById('cardCVC').value.trim();
    // validações básicas
    if(!name || number.length<12 || expiry.length<4 || cvc.length<3){
      paymentMessage.style.color = 'crimson';
      paymentMessage.textContent = 'Dados do cartão inválidos.';
      return;
    }
    if(!luhnCheck(number)){
      paymentMessage.style.color = 'crimson';
      paymentMessage.textContent = 'Número do cartão inválido.';
      return;
    }
    // simula processamento
    paymentMessage.style.color = 'green';
    paymentMessage.textContent = 'Pagamento aprovado — obrigado pela compra!';
    // limpar carrinho após pequena espera (simulada)
    setTimeout(()=>{
      cart = []; localStorage.removeItem('mf_cart');
      renderCartItems(); updateCartUI();
      checkoutModal.setAttribute('aria-hidden','true');
      cartModal.setAttribute('aria-hidden','true');
      checkoutForm.reset();
    },1200);
  });

  // inicialização
  renderProducts();
  renderCartItems();
  updateCartUI();
});
