import "../style/mypage.scss";
import "../style/loadingmypage.scss";
import { router } from "../route";
import { userToken, afterLoadUserAuth } from "../utilities/userAuth";
import {
  userAuth,
  userInfoEdit,
  getBankAccount,
  getCurrentAccount,
  addBankAccount
} from "../utilities/userapi";
import { getBuyList, getBuyDetail, getProductDetail } from "../utilities/productapi";

export async function renderOrderHisory() {
  const app = document.querySelector("#app");
  app.innerHTML = "";

  app.append(handlingLoading());

  const loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증
  if (!loginState) {
    const loginMessageEl = document.createElement("div");
    loginMessageEl.className = "loginMessage";
    loginMessageEl.innerText = "로그인이 필요합니다!";

    app.append(loginMessageEl);
  } else {
    const sectionEl = document.createElement("section");
    sectionEl.className = "myPage";
    const articleEl = document.createElement("article");

    const buyList = await getBuyList(userToken._token);

    await renderSideMenu(sectionEl, articleEl);

    const titleEl = document.createElement("h1");
    titleEl.textContent = "나의 주문";

    const contentEl = document.createElement("div");
    contentEl.className = "buyList";

    const buyListSort = buyList.sort(
      (a, b) => new Date(b.timePaid) - new Date(a.timePaid)
    );

    await renderBuyList(contentEl, buyListSort);

    articleEl.append(titleEl, contentEl);

    app.append(sectionEl);

    const loading = document.querySelector(".skeleton");
    loading?.remove();
  }
}

async function renderBuyList(contentEl, buyList) {
  const buyItemEl = buyList.map((item) => {
    const buyItemLiEl = document.createElement("a");
    buyItemLiEl.className = "buyItemLi";

    const stateEl = document.createElement("div");
    stateEl.className = "buyItemLi__state";
    if (item.isCanceled === false && item.done === false) {
      stateEl.textContent = "결제완료";
      stateEl.style.color = "#000";
    } else if (item.isCanceled === true) {
      stateEl.textContent = "반품환불완료";
    } else if (item.done === true) {
      stateEl.textContent = "구매확정완료";
    }

    const thumbnailEl = document.createElement("div");
    thumbnailEl.className = "buyItemLi__thumbnail";

    if (item.product.thumbnail) {
      thumbnailEl.style.backgroundImage = `url(${item.product.thumbnail})`;
      thumbnailEl.style.backgroundSize = "cover";
    }

    const summaryEl = document.createElement("div");
    summaryEl.className = "buyItemLi__summary";

    const timePaidEl = document.createElement("div");
    timePaidEl.className = "buyItemLi__summary__timePaid";
    const localTime = new Date(item.timePaid);

    timePaidEl.textContent = `${localTime.toLocaleDateString("ko-Kr")} 결제`;

    const titleEl = document.createElement("div");
    titleEl.className = "buyItemLi__summary__title";
    titleEl.textContent = `${item.product.title}`;

    const priceEl = document.createElement("div");
    priceEl.className = "buyItemLi__summary__price";
    priceEl.textContent = `${item.product.price.toLocaleString()}원`;

    summaryEl.append(timePaidEl, titleEl, priceEl);

    if (item.isCanceled === false && item.done === false) {
      const btnsEl = document.createElement("div");
      btnsEl.className = "buyItemLi__summary__btns";

      const isCanceledBtnEl = document.createElement('button');
      isCanceledBtnEl.setAttribute('type', 'button');
      isCanceledBtnEl.textContent = '주문취소';
      isCanceledBtnEl.classList.add('red-btn');
      const doneBtnEl = document.createElement('button');
      doneBtnEl.setAttribute('type', 'button');
      doneBtnEl.textContent = '구매확정';
      doneBtnEl.classList.add('darken-btn');

      btnsEl.append(isCanceledBtnEl, doneBtnEl);

      summaryEl.append(btnsEl);
    } else {
      const repurchaseBtnEl = document.createElement("button");
      repurchaseBtnEl.setAttribute('type', 'button');
      repurchaseBtnEl.textContent = "재구매";
      repurchaseBtnEl.classList.add("common-btn");

      summaryEl.append(repurchaseBtnEl);
    }

    buyItemLiEl.append(stateEl, thumbnailEl, summaryEl);

    buyItemLiEl.setAttribute('id', `${item.detailId}`);
    buyItemLiEl.addEventListener('click', () => {
      router.navigate(`/mypage/order/detail/${buyItemLiEl.id}`);
    })

    return buyItemLiEl;
  });
  contentEl.append(...buyItemEl);
}

export async function renderOrderDetail(detailId) {
  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.append(handlingLoading(true));

  const loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증
  if (!loginState) {
    const loading = document.querySelector(".skeleton");
    loading.remove();

    const loginMessageEl = document.createElement("div");
    loginMessageEl.className = "loginMessage";
    loginMessageEl.innerText = "로그인이 필요합니다!";

    app.append(loginMessageEl);
  } else {
    const sectionEl = document.createElement("section");
    sectionEl.className = "myPage";
    const articleEl = document.createElement("article");
    
    const profile = await userAuth(userToken._token);

    await renderSideMenu(sectionEl, articleEl);

    const orderDetail = await getBuyDetail(userToken._token, detailId);
    const localTime = new Date(orderDetail.timePaid);
    console.log(orderDetail);

    articleEl.innerHTML = /*html*/`
    <h1>주문 상세</h1>
    <div class="productInfo info">
      <div class="header">상품 정보</div>
      <div class="productInfo__img backgroundimg">
        <img src="${orderDetail.product.thumbnail}" alt="profileImg" class="productInfo__img img">
      </div>
      <div class="productInfo__state"></div>
      <div class="productInfo__title">${orderDetail.product.title}</div>
      <div class="productInfo__price">${orderDetail.product.price.toLocaleString()}원</div>
      <div class="productInfo__button"></div>   
    </div>
    <div class="ordererInfo info">
      <div class="header">주문자 정보</div>
      <div class="ordererInfo__name"><span>이름</span>${profile.displayName}</div>
      <div class="ordererInfo__email"><span>메일</span>${profile.email}</div>
    </div>
    <div class="paymentInfo info">
      <div class="header">결제 정보</div>
      <div class="paymentInfo__way">계좌 간편결제</div>
      <div class="paymentInfo__bankName">${orderDetail.account.bankName}</div>
      <div class="paymentInfo__accountNumber">${orderDetail.account.accountNumber}</div>
      <div class="paymentInfo__price">${orderDetail.product.price.toLocaleString()}원</div>
      <div class="paymentInfo__timePaid">${localTime.toLocaleString('ko-kr')}</div>
    </div>
    `
    app.append(sectionEl);

    const stateEl = document.querySelector('.productInfo__state');
    if (orderDetail.isCanceled === false && orderDetail.done === false) {
      stateEl.textContent = "[결제완료]";
      stateEl.style.color = "#000";
    } else if (orderDetail.isCanceled === true) {
      stateEl.textContent = "[반품환불완료]";
    } else if (orderDetail.done === true) {
      stateEl.textContent = "[구매확정완료]";
    }

    const thumbnailEl = document.querySelector('.img');

    if (!orderDetail.product.thumbnail) {
      thumbnailEl.remove()
    }

    const productInfoBtns = document.querySelector('.productInfo__button');

    if (orderDetail.isCanceled === false && orderDetail.done === false) {
      const btnsEl = document.createElement("div");
      btnsEl.className = "productInfo__button__btns";

      const isCanceledBtnEl = document.createElement('button');
      isCanceledBtnEl.setAttribute('type', 'button');
      isCanceledBtnEl.textContent = '주문취소';
      isCanceledBtnEl.classList.add('red-btn');
      const doneBtnEl = document.createElement('button');
      doneBtnEl.setAttribute('type', 'button');
      doneBtnEl.textContent = '구매확정';
      doneBtnEl.classList.add('darken-btn');

      btnsEl.append(isCanceledBtnEl, doneBtnEl);

      productInfoBtns.append(btnsEl);
    } else {
      const repurchaseBtnEl = document.createElement("button");
      repurchaseBtnEl.setAttribute('type', 'button');
      repurchaseBtnEl.textContent = "재구매";
      repurchaseBtnEl.classList.add("common-btn");

      productInfoBtns.append(repurchaseBtnEl);
    }
    
    const isCurrentTrue = await getProductDetail(orderDetail.product.productId);

    const productInfoEl = document.querySelector('.productInfo');
    productInfoEl.setAttribute('id', `${orderDetail.product.productId}`);
    productInfoEl.addEventListener('click', () => {
      if (isCurrentTrue === "유효한 제품 정보가 아닙니다."){
        window.alert('현재 판매하는 제품이 아닙니다.');
      }
      else{
        router.navigate(`/product/detail/${productInfoEl.id}`);
      }
    });

    const loading = document.querySelector(".skeleton");
    loading.remove();
  }
}

export async function renderMyAccount() {
  const app = document.querySelector("#app");
  app.innerHTML = "";

  app.append(handlingLoading(true));

  const loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증
  if (!loginState) {
    const loading = document.querySelector(".skeleton");
    loading.remove();

    const loginMessageEl = document.createElement("div");
    loginMessageEl.className = "loginMessage";
    loginMessageEl.innerText = "로그인이 필요합니다!";

    app.append(loginMessageEl);
  } else {
    const sectionEl = document.createElement("section");
    sectionEl.className = "myPage";
    const articleEl = document.createElement("article");

    const accountList = await getCurrentAccount(userToken._token);

    await renderSideMenu(sectionEl, articleEl);

    const titleEl = document.createElement("h1");
    titleEl.textContent = "나의 계좌";

    const contentEl = document.createElement("div");
    contentEl.className = "accountList";

    await renderAccountList(contentEl, accountList);

    const addAccountBtnEl = document.createElement("a");
    addAccountBtnEl.className = "addAccountBtn";
    addAccountBtnEl.innerHTML =
      '<span class="material-symbols-outlined">add_circle</span> 계좌 연결';
    
    addAccountBtnEl.addEventListener('click', () => {
      router.navigate('/mypage/account/add');
    })

    contentEl.append(addAccountBtnEl);

    articleEl.append(titleEl, contentEl);

    app.append(sectionEl);

    const loading = document.querySelector(".skeleton");
    loading.remove();
  }
}

export async function renderAccountAdd(){
  const app = document.querySelector("#app");
  app.innerHTML = "";

  app.append(handlingLoading(true));

  const loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증
  if (!loginState) {
    const loading = document.querySelector(".skeleton");
    loading.remove();

    const loginMessageEl = document.createElement("div");
    loginMessageEl.className = "loginMessage";
    loginMessageEl.innerText = "로그인이 필요합니다!";

    app.append(loginMessageEl);
  } else {
    const sectionEl = document.createElement("section");
    sectionEl.className = "myPage";
    const articleEl = document.createElement("article");

    const profile = await userAuth(userToken._token);
    const buyList = await getBuyList(userToken._token);
    const accountList = await getCurrentAccount(userToken._token);

    await renderSideMenu(sectionEl, articleEl, profile, buyList, accountList);

    articleEl.innerHTML = /*html*/`
      <h1>계좌 연결</h1>
        <div class="accountAdd">
          <div class="accountAdd__bank accountAdd--box">
            <div class="accountAdd__bank__title accountAdd--box--header">은행 선택</div>
            <div class="accountAdd__bank__list">

            </div>
          </div>
          <div class="accountAdd__accountNumber accountAdd--box">
            <div class="accountAdd__accountNumber__title accountAdd--box--header">계좌번호</div>
            <input type="text" class="accountAdd__accountNumber__input" placeholder="공백 없이 '-'을 제외하고 입력해 주세요!">
          </div>
          <div class="accountAdd__name accountAdd--box">
            <div class="accountAdd__name__title accountAdd--box--header">이름</div>
            <input type="text" class="accountAdd__name__input" placeholder="공백없이 입력해 주세요.">
          </div>
          <div class="accountAdd__phoneNumber accountAdd--box">
            <div class="accountAdd__phoneNumber__title accountAdd--box--header">전화번호</div>
            <input type="text" class="accountAdd__phoneNumber__input" placeholder="공백 없이 '-'을 제외하고 입력해 주세요!">
          </div>
          <div class="accountAdd__btns">
            <button type="button" class="red-btn cancelButton">취소</button>
            <button type="button" class="darken-btn doneButton">완료</button>
          </div>
        </div>
    `

    app.append(sectionEl);

    const bankAccount = await getBankAccount(userToken._token);
    const bankSelectEl = document.querySelector(".accountAdd__bank__list");
    
    await renderAccountListOptionAdd(bankSelectEl, bankAccount, profile);

    // 이미 개설된 은행은 선택 비활성화
    for(let i = 0; i < Object.keys(bankAccount).length; i++) {
      if(bankAccount[Object.keys(bankAccount)[i]].disabled){
        document.getElementById(`${bankAccount[Object.keys(bankAccount)[i]].name}`).disabled = true;
      }
    }

    const cancelButtonEl = document.querySelector('.cancelButton');
    cancelButtonEl.addEventListener('click', () => {
      router.navigate("/mypage/account");
    })

    const loading = document.querySelector(".skeleton");
    loading.remove();
  }
}

async function renderAccountListOptionAdd(bankSelectEl, bankAccount, profile){
  
  const logoList = [
    ['KB국민은행', '<svg width="32" height="23" viewBox="0 0 32 23"><path fill="#FBAF17" fill-rule="evenodd" d="M31.206 11.625c-.943-.95-2.257-1.362-4.015-1.259-1.463.09-2.623.676-3.509 1.22l-.001-.04c0-.463.052-.964.103-1.451.05-.495.104-.999.104-1.475 0-.486-.054-.947-.22-1.341-.042-.101-.135-.161-.252-.161-.472.01-1.395.337-1.619.534l-.122.27c-.007.528-.123 2.002-.24 2.181.005-.007-.061.178-.061.178-.2 2.105-.203 3.957-.02 5.547.021.158.325.397.559.484.257.095 1.06-.122 1.524-.298-.006.002.174-.028.174-.028.146-.016.232-.14.226-.309-.002-.003.011-.457.011-.457.335-1.372 1.688-3.01 3.29-3.255.906-.145 1.621.09 2.186.71.076.112.24 1.1-.356 2.234-.444.84-1.332 1.548-2.501 1.99-1.107.425-2.323.595-3.827.544-.063-.041-1.407-.96-1.407-.96-1.193-.845-2.674-1.896-4.017-2.41-.236-.092-.658-.445-.913-.658l-.139-.114c-.774-.627-2.248-1.619-3.431-2.413 0 0-.534-.362-.638-.431l.001-.136c.035-.038.78-.488.78-.488 1.04-.614 1.521-.915 1.624-1.071-.022.025.137-.083.137-.083.01-.004 2.582-1.473 2.582-1.473 2.478-1.373 5.285-2.933 6.759-4.473.002-.002.072-.236.072-.236l.032-.209c.099-.33.104-.581.021-.875-.021-.083-.097-.18-.2-.198-1.151-.116-2.635.58-3.987 1.86-.305.288-.561.43-.832.578l-.207.116c-1.49.855-4.846 2.957-6.605 4.091.116-1.906.465-4.618.896-6.88L13.12.71 12.938.37l-.137-.245-.039-.01c-.35-.18-.637-.106-.848-.054l-.35.131-.47.172c-.092.018-.157.076-.192.166-.84 2.047-1.54 5.413-1.706 8.106C7.52 7.56 5.97 6.785 5.208 6.411l-.02-.012-.09-.02c-.275-.035-.608-.238-.928-.434-.034-.02-.639-.417-.639-.417l-.974-.63c.007.006-.257-.06-.257-.06-.419.073-1.222.618-1.46.99-.032.05-.045.102-.045.158 0 .078.025.157.044.233l.043.2.046.12c.467.484 1.646 1.289 2.802 1.916l1.34.716 2.05 1.13c0 .01.35.28.35.28l.241.14s.029.017.044.028c-.546.37-3.73 2.514-3.73 2.514l-1.962 1.311c-.185.128-.96.478-1.13.547-.425.175-.747.443-.88.734L0 15.969l.053.076.15.115c-.007 0 .2.132.2.132l.217.15.204.032c.345.014.856-.185 1.81-.607.878-.391 3.26-1.842 4.279-2.46l.434-.263c.18.014.376-.139.554-.273.204-.164.648-.44.919-.56.008-.003.162-.09.309-.172l-.003.118c.046 3.144.224 5.429.565 7.19l.005.03.033.071c.168.249.358.994.528 1.65l.388 1.313c.008.015.109.122.109.122.221.152.897.414 1.347.36l.112-.014.072-.16c.038-.196.051-.389.051-.601 0-.24-.017-.503-.038-.827l-.03-.473c-.143-2.195-.286-5.363-.286-7.47v-.167c.37.233 1.986 1.261 1.986 1.261 2.751 1.8 6.906 4.52 9.418 5.24.13.04.268.009.364-.084.004-.005.386-.25.386-.25l.073-.03c.144-.07.24-.314.257-.58 2.116-.107 5.068-.93 6.648-2.933.612-.778.886-1.729.886-2.542 0-.668-.183-1.244-.517-1.56l-.277-.178z"></path></svg>'],
    ['신한은행', '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 22 22"><g clip-path="url(#iin1gzobtpe_a)"><path d="M11 0C4.924 0 0 4.924 0 11c0 6.074 4.924 11 11 11 6.074 0 11-4.924 11-11S17.074 0 11 0zm.229 19.984c-1.316.186-3.458-.149-4.91-1.066a6.678 6.678 0 0 1-2.52-2.828c-.5-1.042-.74-2.306-.204-2.243.25.029.465.503.95 1.121.33.423.634.778.863.827.102.023.188-.024.26-.163.136-.261.32-.758.651-1.16.268-.308.588-.451.774.3.09.374.161.76.202 1.097.06.476.09.76.256.841.157.078.426-.022.86-.183.31-.117.71-.264 1.215-.409.463-.133.76-.063.461.66-.14.34-.284.627-.786 1.352-.088.126-.072.253.039.363.167.168.549.37.972.554a8.85 8.85 0 0 0 1 .347c.415.114.333.531-.083.59zm5.645-2.365c-.41.666-1.268 1.387-2.31 1.867-.157.071-.327.049-.368-.08-.037-.112.051-.239.155-.361 1.357-1.76.35-3.372-1.84-4.624-1.617-.925-2.647-1.456-3.84-2.159C5.176 10.203 4.5 8.41 4.363 7.348c-.349-2.685 1.87-4.693 4.148-5.177.07-.014.252-.043.31.108.06.151-.075.262-.154.31-1.02.562-2.022 1.753-1.912 3.076.061.74.378 1.804 2.38 3.231 1.206.862 2.687 1.569 5.669 3.356 3.151 1.89 2.792 4.193 2.07 5.367zm.492-10.06c-.719.88-1.44.553-1.993-.687-.345-.774-.801-.96-1.122-.757-.349.22-.21.751.18 1.362.255.4.141.87-.124 1.148-.28.292-.738.408-1.236.298-.886-.196-1.758-1.383-1.121-3.976.257-1.046-.245-1.495-.564-1.898-.16-.202-.18-.322-.12-.404.063-.088.21-.094.471-.039.341.072.848.247 1.26.31.274.043.585.056.91.043.884-.034 1.535.102 2.203.433 1.131.56 1.248 1.526.619 1.448-.219-.026-.499-.192-.73-.304-.155-.076-.29-.1-.387-.029-.092.068-.133.209-.066.348.141.296.617.449 1.26.627 1.128.308 1.15 1.354.56 2.077z" fill="#0046ff"></path></g><defs><clipPath id="iin1gzobtpe_a"><path fill="#fff" d="M0 0h22v22H0z"></path></clipPath></defs></svg>'],
    ['우리은행', '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 17 17"><defs><radialGradient id="160v3xlgp1x" cx="50.008%" cy="84.584%" r="79.27%" fx="50.008%" fy="84.584%"><stop offset="0%" stop-color="#FEFEFE"></stop><stop offset="52.96%" stop-color="#FFF"></stop><stop offset="58.58%" stop-color="#BAE0F5"></stop><stop offset="65.62%" stop-color="#0EAFE3"></stop><stop offset="73.41%" stop-color="#0096D6"></stop><stop offset="83.09%" stop-color="#007BC6"></stop><stop offset="100%" stop-color="#007BC6"></stop></radialGradient></defs><g fill="none" fill-rule="evenodd"><path fill="url(#160v3xlgp1x)" d="M8.47 0C3.79.01 0 3.82 0 8.5 0 13.2 3.8 17 8.5 17a8.5 8.5 0 1 0 0-17h-.03"></path><path fill="#0083CA" fill-rule="nonzero" d="M8.5 16.98c3.49 0 6.49-2.11 7.8-5.12-2.26-.84-4.93-1.32-7.8-1.32s-5.54.48-7.8 1.32a8.495 8.495 0 0 0 7.8 5.12z"></path></g></svg>'],
    ['하나은행', '<svg width="28" height="26" viewBox="0 0 28 25"><g fill="none" fill-rule="evenodd"><path fill="#008F90" d="M18.34 14.889c-.064-.378-.17-.745-.326-1.084-.489-1.037-1.17-1.905-2.192-2.487-1.592-.91-3.514-.903-5.086.03-.712.422-1.297 1.027-1.674 1.756-.129.245-.231.505-.318.77-.412 1.288-.399 3.022.349 4.199.244.384.595.713 1.026.875.432.163.943.145 1.332-.1.499-.317.587-.918.495-1.456-.118-.687-.208-1.36.048-2.031.083-.216.2-.421.369-.58.103-.095.224-.173.352-.234.271-.13.58-.188.878-.14.519.082.948.477 1.178.94.23.465.294.99.319 1.505.11 2.247-.439 4.575-1.026 6.733-.057.223-.12.443-.185.664-.049.171-.14.39-.027.554.048.072.123.122.206.153.337.136.617-.07.844-.293 1.346-1.326 2.208-3.035 2.799-4.795.219-.654.407-1.323.537-2.004.174-.928.271-1.994.101-2.975M27.974 4.504c0-.337-.305-.56-.633-.548-.332.01-.64.18-.945.292C20.477 6.452 13.8 6.87 7.561 5.99c-1.067-.151-2.148-.363-3.223-.526-.67-.103-1.333-.251-2.01-.3-.578-.044-1.3-.065-1.764.328-.615.52-.572 1.507-.222 2.158.418.782 1.153 1.368 1.916 1.814.743.431 1.626.893 2.512.84 2.383-.15 4.763-.376 7.133-.678 4.039-.513 8.277-.997 12.072-2.531 1.24-.503 2.464-1.128 3.53-1.938.191-.141.47-.377.47-.653"></path><path fill="#E50044" d="M10.998 2.52c0 1.257 1.042 2.278 2.328 2.278 1.286 0 2.327-1.02 2.327-2.279 0-.187-.043-.376-.124-.547-.2-.414-.423-.615-.404-1.111.033-.67-.844-.678-1.318-.678-.514 0-1.062.07-1.525.298-.371.183-.69.462-.915.804-.233.352-.36.763-.37 1.18v.054"></path></g></svg>'],
    ['케이뱅크', '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="13" viewBox="0 0 52 13"><path d="M16.71 3.534c-.937 0-1.803.327-2.435.936l-.21.21V0H11.56v7.98c0 2.972 1.778 4.845 4.657 4.845 2.808 0 4.844-1.943 4.844-4.634 0-2.691-1.825-4.657-4.353-4.657zm-.399 7.02a2.357 2.357 0 0 1-2.363-2.363 2.357 2.357 0 0 1 2.363-2.364 2.357 2.357 0 0 1 2.364 2.364 2.357 2.357 0 0 1-2.364 2.364zM7.442 0 2.504 5.71V0H0v12.544h2.504V6.88l5.032 5.664h3.23L5.218 6.272 10.625 0H7.442zM52 3.838h-2.761l-3.183 3.744V0h-2.48v12.544h2.48V8.776l3.183 3.768H52L48.326 8.19 52 3.838zM38.684 3.534c-1.544 0-2.48.725-2.925 1.217v-.913h-2.41v8.706h2.48V7.816c0-1.193.82-2.012 1.849-2.012 1.03 0 1.849.819 1.849 2.012v4.728h2.48v-5.5c.047-2.036-1.427-3.51-3.323-3.51zM27.03 3.534c-2.785 0-4.798 1.966-4.798 4.657s1.849 4.633 4.423 4.633c1.826 0 2.785-1.31 2.808-1.333l.14-.188v1.24h2.27V8.192C31.85 5.5 29.815 3.534 27.03 3.534zm.07 7.02a2.357 2.357 0 0 1-2.364-2.363A2.357 2.357 0 0 1 27.1 5.827a2.357 2.357 0 0 1 2.363 2.364 2.372 2.372 0 0 1-2.363 2.364z" fill="#120064"></path></svg>'],
    ['카카오뱅크', '<svg width="23" height="23" viewBox="0 0 25 25"><defs><path id="bikakao__a" d="M0 0.047L24.953 0.047 24.953 24.912 0 24.912z"></path><path id="bikakao__c" d="M0 24.953L24.953 24.953 24.953 0.088 0 0.088z"></path></defs><g fill="none" fill-rule="evenodd"><g transform="translate(0 .04)"><mask id="bikakao__b" fill="#fff"><use xlink:href="#bikakao__a"></use></mask><path fill="#FAE100" d="M23.003 24.912H1.95C.877 24.912 0 24.038 0 22.97V1.99C0 .92.877.047 1.95.047h21.053c1.073 0 1.95.874 1.95 1.943v20.98c0 1.068-.877 1.942-1.95 1.942" mask="url(#bikakao__b)"></path></g><mask id="bikakao__d" fill="#fff"><use xlink:href="#bikakao__c"></use></mask><path fill="#1E1E1E" d="M11.984 15.94h1.293V9.102h-1.293v6.838zm4.672-3.42c1.114-.732 1.85-1.989 1.85-3.419 0-2.26-1.839-4.091-4.107-4.091H7.516c-.132 0-.238.106-.238.236v14.548c0 .132.106.238.238.238h6.883c2.268 0 4.107-1.832 4.107-4.092 0-1.43-.736-2.688-1.85-3.42z" mask="url(#bikakao__d)"></path></g></svg>'],
    ['NH농협은행', '<svg width="20" height="25" viewBox="0 0 20 25"><path fill="#FCB813" fill-rule="evenodd" d="M19.422 1.408v4.668l-3.38 1.397.073.062c2.116 1.824 3.33 4.45 3.33 7.208 0 5.273-4.362 9.563-9.723 9.563-5.36 0-9.722-4.29-9.722-9.563 0-2.76 1.215-5.386 3.333-7.208l.073-.062L.03 6.076V1.408l5.864 2.459 3.248 6.058c-2.49.293-4.359 2.347-4.359 4.818 0 2.679 2.213 4.86 4.939 4.86 2.723 0 4.937-2.181 4.937-4.86 0-2.471-1.87-4.525-4.36-4.818.07-.136 3.251-6.058 3.251-6.058l5.872-2.46zM14.46.694L9.72 9.546 4.99.694l4.73 2.34 4.74-2.34z"></path></svg>']
  ];

  const bankListArr = logoList.map( ([bankName, bankImg]) => {
    const bankSelectOptionEl = document.createElement('div');
    bankSelectOptionEl.className = `bankSelectOption`;
    bankSelectOptionEl.innerHTML = /*html*/`
      <input type="radio" id="${bankName}" name="bankList" value="${bankName}">
      <label for="${bankName}">${bankImg}${bankName}</label>
    `;

    let currentCheckedBank;
    let currentCheckedBankCode;
    let currentCheckedBankdigits;

    let preventDoubleClickA = false;
    let preventDoubleClickB = false;
    bankSelectOptionEl.addEventListener('click', () => {
      if(preventDoubleClickA) return
      preventDoubleClickA = true;
      // 같은 name 속성을 가진 라디오 버튼들을 가져오고, 그 길이를 구한다.
      const bankListLength = document.getElementsByName('bankList').length;
      // 그 중 checked된 요소의 value값을 currentCheckedBank 변수에 저장한다.
        for(let i = 0; i<bankListLength; i++){
        if (document.getElementsByName('bankList')[i].checked){
          currentCheckedBank = document.getElementsByName('bankList')[i].value;
        }
      }
      // 전체 은행 목록 중 현제 체크된 은행을 찾아 해당 은행의 코드와 계좌번호 양식을 저장한다.
        for(let i = 0; i < Object.keys(bankAccount).length; i++) {
        if(bankAccount[Object.keys(bankAccount)[i]].name === currentCheckedBank){
          currentCheckedBankCode = bankAccount[Object.keys(bankAccount)[i]].code;
          currentCheckedBankdigits = bankAccount[Object.keys(bankAccount)[i]].digits;
        }
      }
      console.log(currentCheckedBankCode);
      // 확인버튼을 클릭했을 때
      const doneButtonEl = document.querySelector('.doneButton');
      doneButtonEl.addEventListener('click', async () => {
        if(preventDoubleClickB) return
        preventDoubleClickB = true;
        if((!currentCheckedBankCode) || (!accountNumber) || (!phoneNumber) || (!nameInputValue)){
          console.log(currentCheckedBankCode)
          console.log(accountNumber)
          console.log(phoneNumber)
          console.log(nameInputValue)
          window.alert('내용을 모두 입력해 주세요!');
          preventDoubleClickB = false;
        }
        else{
          accountNumber = accountNumber.replace(/(\s*)/g, "");
          phoneNumber = phoneNumber.replace(/(\s*)/g, "");
          if((isNaN(Number(accountNumber))) || (isNaN(Number(phoneNumber))) || !signature){
            window.alert('내용을 다시 검토해 주세요!');
            preventDoubleClickB = false;
          }
          else{
            const accountLength = currentCheckedBankdigits.reduce((acc, cur) => acc + cur);
            const phoneNumberLength = 3+4+4;
            console.log(accountLength);
            console.log(phoneNumberLength);
            console.log(accountNumber.length);
            console.log(phoneNumber.length);
            if((accountNumber.length !== accountLength) || (phoneNumber.length !== phoneNumberLength)){
              window.alert('길이가 맞지 않습니다.')
              preventDoubleClickB = false;
            }
            else {
              window.alert('계좌가 등록되었습니다!')
              const addAccountData = {
                userToken: userToken._token,
                account: {
                  bankCode: currentCheckedBankCode,
                  accountNumber,
                  phoneNumber,
                  signature
                }
              };
              console.log(addAccountData);
              await addBankAccount(addAccountData);
              router.navigate("/mypage/account");
              preventDoubleClickB = false;
            }
          }
        }
      })
      preventDoubleClickA = false;
    })

    // 계좌번호, 이름, 전화번호의 input 요소를 변수에 저장
    const accountNumberInputEl = document.querySelector('.accountAdd__accountNumber__input');
    const nameInputEl = document.querySelector('.accountAdd__name__input');
    const phoneNumberInputEl = document.querySelector('.accountAdd__phoneNumber__input');

    // 앞의 input 요소의 value값을 저장할 변수들
    let accountNumber;
    let phoneNumber;
    let signature;

    accountNumberInputEl.addEventListener('input', () => {
      accountNumber = accountNumberInputEl.value;
      console.log(accountNumber);
    })

    let nameInputValue;
    nameInputEl.addEventListener('input', () => {
      nameInputValue = nameInputEl.value;
      if(profile.displayName === nameInputValue){
        signature = true;
      }
      else { signature = false; }
      console.log(signature);
    })

    phoneNumberInputEl.addEventListener('input', () => {
      phoneNumber = phoneNumberInputEl.value;
      console.log(phoneNumber);
    })

    return bankSelectOptionEl;
  })

  bankSelectEl.append(...bankListArr);
}

async function renderAccountList(contentEl, accountList) {
  const accountEl = accountList.accounts.map((item) => {
    const accountLiEl = document.createElement("li");
    accountLiEl.className = "accountLi";

    const logoList = [
      ['KB국민은행', '<svg width="32" height="23" viewBox="0 0 32 23"><path fill="#FBAF17" fill-rule="evenodd" d="M31.206 11.625c-.943-.95-2.257-1.362-4.015-1.259-1.463.09-2.623.676-3.509 1.22l-.001-.04c0-.463.052-.964.103-1.451.05-.495.104-.999.104-1.475 0-.486-.054-.947-.22-1.341-.042-.101-.135-.161-.252-.161-.472.01-1.395.337-1.619.534l-.122.27c-.007.528-.123 2.002-.24 2.181.005-.007-.061.178-.061.178-.2 2.105-.203 3.957-.02 5.547.021.158.325.397.559.484.257.095 1.06-.122 1.524-.298-.006.002.174-.028.174-.028.146-.016.232-.14.226-.309-.002-.003.011-.457.011-.457.335-1.372 1.688-3.01 3.29-3.255.906-.145 1.621.09 2.186.71.076.112.24 1.1-.356 2.234-.444.84-1.332 1.548-2.501 1.99-1.107.425-2.323.595-3.827.544-.063-.041-1.407-.96-1.407-.96-1.193-.845-2.674-1.896-4.017-2.41-.236-.092-.658-.445-.913-.658l-.139-.114c-.774-.627-2.248-1.619-3.431-2.413 0 0-.534-.362-.638-.431l.001-.136c.035-.038.78-.488.78-.488 1.04-.614 1.521-.915 1.624-1.071-.022.025.137-.083.137-.083.01-.004 2.582-1.473 2.582-1.473 2.478-1.373 5.285-2.933 6.759-4.473.002-.002.072-.236.072-.236l.032-.209c.099-.33.104-.581.021-.875-.021-.083-.097-.18-.2-.198-1.151-.116-2.635.58-3.987 1.86-.305.288-.561.43-.832.578l-.207.116c-1.49.855-4.846 2.957-6.605 4.091.116-1.906.465-4.618.896-6.88L13.12.71 12.938.37l-.137-.245-.039-.01c-.35-.18-.637-.106-.848-.054l-.35.131-.47.172c-.092.018-.157.076-.192.166-.84 2.047-1.54 5.413-1.706 8.106C7.52 7.56 5.97 6.785 5.208 6.411l-.02-.012-.09-.02c-.275-.035-.608-.238-.928-.434-.034-.02-.639-.417-.639-.417l-.974-.63c.007.006-.257-.06-.257-.06-.419.073-1.222.618-1.46.99-.032.05-.045.102-.045.158 0 .078.025.157.044.233l.043.2.046.12c.467.484 1.646 1.289 2.802 1.916l1.34.716 2.05 1.13c0 .01.35.28.35.28l.241.14s.029.017.044.028c-.546.37-3.73 2.514-3.73 2.514l-1.962 1.311c-.185.128-.96.478-1.13.547-.425.175-.747.443-.88.734L0 15.969l.053.076.15.115c-.007 0 .2.132.2.132l.217.15.204.032c.345.014.856-.185 1.81-.607.878-.391 3.26-1.842 4.279-2.46l.434-.263c.18.014.376-.139.554-.273.204-.164.648-.44.919-.56.008-.003.162-.09.309-.172l-.003.118c.046 3.144.224 5.429.565 7.19l.005.03.033.071c.168.249.358.994.528 1.65l.388 1.313c.008.015.109.122.109.122.221.152.897.414 1.347.36l.112-.014.072-.16c.038-.196.051-.389.051-.601 0-.24-.017-.503-.038-.827l-.03-.473c-.143-2.195-.286-5.363-.286-7.47v-.167c.37.233 1.986 1.261 1.986 1.261 2.751 1.8 6.906 4.52 9.418 5.24.13.04.268.009.364-.084.004-.005.386-.25.386-.25l.073-.03c.144-.07.24-.314.257-.58 2.116-.107 5.068-.93 6.648-2.933.612-.778.886-1.729.886-2.542 0-.668-.183-1.244-.517-1.56l-.277-.178z"></path></svg>'],
      ['신한은행', '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 22 22"><g clip-path="url(#iin1gzobtpe_a)"><path d="M11 0C4.924 0 0 4.924 0 11c0 6.074 4.924 11 11 11 6.074 0 11-4.924 11-11S17.074 0 11 0zm.229 19.984c-1.316.186-3.458-.149-4.91-1.066a6.678 6.678 0 0 1-2.52-2.828c-.5-1.042-.74-2.306-.204-2.243.25.029.465.503.95 1.121.33.423.634.778.863.827.102.023.188-.024.26-.163.136-.261.32-.758.651-1.16.268-.308.588-.451.774.3.09.374.161.76.202 1.097.06.476.09.76.256.841.157.078.426-.022.86-.183.31-.117.71-.264 1.215-.409.463-.133.76-.063.461.66-.14.34-.284.627-.786 1.352-.088.126-.072.253.039.363.167.168.549.37.972.554a8.85 8.85 0 0 0 1 .347c.415.114.333.531-.083.59zm5.645-2.365c-.41.666-1.268 1.387-2.31 1.867-.157.071-.327.049-.368-.08-.037-.112.051-.239.155-.361 1.357-1.76.35-3.372-1.84-4.624-1.617-.925-2.647-1.456-3.84-2.159C5.176 10.203 4.5 8.41 4.363 7.348c-.349-2.685 1.87-4.693 4.148-5.177.07-.014.252-.043.31.108.06.151-.075.262-.154.31-1.02.562-2.022 1.753-1.912 3.076.061.74.378 1.804 2.38 3.231 1.206.862 2.687 1.569 5.669 3.356 3.151 1.89 2.792 4.193 2.07 5.367zm.492-10.06c-.719.88-1.44.553-1.993-.687-.345-.774-.801-.96-1.122-.757-.349.22-.21.751.18 1.362.255.4.141.87-.124 1.148-.28.292-.738.408-1.236.298-.886-.196-1.758-1.383-1.121-3.976.257-1.046-.245-1.495-.564-1.898-.16-.202-.18-.322-.12-.404.063-.088.21-.094.471-.039.341.072.848.247 1.26.31.274.043.585.056.91.043.884-.034 1.535.102 2.203.433 1.131.56 1.248 1.526.619 1.448-.219-.026-.499-.192-.73-.304-.155-.076-.29-.1-.387-.029-.092.068-.133.209-.066.348.141.296.617.449 1.26.627 1.128.308 1.15 1.354.56 2.077z" fill="#0046ff"></path></g><defs><clipPath id="iin1gzobtpe_a"><path fill="#fff" d="M0 0h22v22H0z"></path></clipPath></defs></svg>'],
      ['우리은행', '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 17 17"><defs><radialGradient id="160v3xlgp1x" cx="50.008%" cy="84.584%" r="79.27%" fx="50.008%" fy="84.584%"><stop offset="0%" stop-color="#FEFEFE"></stop><stop offset="52.96%" stop-color="#FFF"></stop><stop offset="58.58%" stop-color="#BAE0F5"></stop><stop offset="65.62%" stop-color="#0EAFE3"></stop><stop offset="73.41%" stop-color="#0096D6"></stop><stop offset="83.09%" stop-color="#007BC6"></stop><stop offset="100%" stop-color="#007BC6"></stop></radialGradient></defs><g fill="none" fill-rule="evenodd"><path fill="url(#160v3xlgp1x)" d="M8.47 0C3.79.01 0 3.82 0 8.5 0 13.2 3.8 17 8.5 17a8.5 8.5 0 1 0 0-17h-.03"></path><path fill="#0083CA" fill-rule="nonzero" d="M8.5 16.98c3.49 0 6.49-2.11 7.8-5.12-2.26-.84-4.93-1.32-7.8-1.32s-5.54.48-7.8 1.32a8.495 8.495 0 0 0 7.8 5.12z"></path></g></svg>'],
      ['하나은행', '<svg width="28" height="26" viewBox="0 0 28 25"><g fill="none" fill-rule="evenodd"><path fill="#008F90" d="M18.34 14.889c-.064-.378-.17-.745-.326-1.084-.489-1.037-1.17-1.905-2.192-2.487-1.592-.91-3.514-.903-5.086.03-.712.422-1.297 1.027-1.674 1.756-.129.245-.231.505-.318.77-.412 1.288-.399 3.022.349 4.199.244.384.595.713 1.026.875.432.163.943.145 1.332-.1.499-.317.587-.918.495-1.456-.118-.687-.208-1.36.048-2.031.083-.216.2-.421.369-.58.103-.095.224-.173.352-.234.271-.13.58-.188.878-.14.519.082.948.477 1.178.94.23.465.294.99.319 1.505.11 2.247-.439 4.575-1.026 6.733-.057.223-.12.443-.185.664-.049.171-.14.39-.027.554.048.072.123.122.206.153.337.136.617-.07.844-.293 1.346-1.326 2.208-3.035 2.799-4.795.219-.654.407-1.323.537-2.004.174-.928.271-1.994.101-2.975M27.974 4.504c0-.337-.305-.56-.633-.548-.332.01-.64.18-.945.292C20.477 6.452 13.8 6.87 7.561 5.99c-1.067-.151-2.148-.363-3.223-.526-.67-.103-1.333-.251-2.01-.3-.578-.044-1.3-.065-1.764.328-.615.52-.572 1.507-.222 2.158.418.782 1.153 1.368 1.916 1.814.743.431 1.626.893 2.512.84 2.383-.15 4.763-.376 7.133-.678 4.039-.513 8.277-.997 12.072-2.531 1.24-.503 2.464-1.128 3.53-1.938.191-.141.47-.377.47-.653"></path><path fill="#E50044" d="M10.998 2.52c0 1.257 1.042 2.278 2.328 2.278 1.286 0 2.327-1.02 2.327-2.279 0-.187-.043-.376-.124-.547-.2-.414-.423-.615-.404-1.111.033-.67-.844-.678-1.318-.678-.514 0-1.062.07-1.525.298-.371.183-.69.462-.915.804-.233.352-.36.763-.37 1.18v.054"></path></g></svg>'],
      ['케이뱅크', '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="13" viewBox="0 0 52 13"><path d="M16.71 3.534c-.937 0-1.803.327-2.435.936l-.21.21V0H11.56v7.98c0 2.972 1.778 4.845 4.657 4.845 2.808 0 4.844-1.943 4.844-4.634 0-2.691-1.825-4.657-4.353-4.657zm-.399 7.02a2.357 2.357 0 0 1-2.363-2.363 2.357 2.357 0 0 1 2.363-2.364 2.357 2.357 0 0 1 2.364 2.364 2.357 2.357 0 0 1-2.364 2.364zM7.442 0 2.504 5.71V0H0v12.544h2.504V6.88l5.032 5.664h3.23L5.218 6.272 10.625 0H7.442zM52 3.838h-2.761l-3.183 3.744V0h-2.48v12.544h2.48V8.776l3.183 3.768H52L48.326 8.19 52 3.838zM38.684 3.534c-1.544 0-2.48.725-2.925 1.217v-.913h-2.41v8.706h2.48V7.816c0-1.193.82-2.012 1.849-2.012 1.03 0 1.849.819 1.849 2.012v4.728h2.48v-5.5c.047-2.036-1.427-3.51-3.323-3.51zM27.03 3.534c-2.785 0-4.798 1.966-4.798 4.657s1.849 4.633 4.423 4.633c1.826 0 2.785-1.31 2.808-1.333l.14-.188v1.24h2.27V8.192C31.85 5.5 29.815 3.534 27.03 3.534zm.07 7.02a2.357 2.357 0 0 1-2.364-2.363A2.357 2.357 0 0 1 27.1 5.827a2.357 2.357 0 0 1 2.363 2.364 2.372 2.372 0 0 1-2.363 2.364z" fill="#120064"></path></svg>'],
      ['카카오뱅크', '<svg width="23" height="23" viewBox="0 0 25 25"><defs><path id="bikakao__a" d="M0 0.047L24.953 0.047 24.953 24.912 0 24.912z"></path><path id="bikakao__c" d="M0 24.953L24.953 24.953 24.953 0.088 0 0.088z"></path></defs><g fill="none" fill-rule="evenodd"><g transform="translate(0 .04)"><mask id="bikakao__b" fill="#fff"><use xlink:href="#bikakao__a"></use></mask><path fill="#FAE100" d="M23.003 24.912H1.95C.877 24.912 0 24.038 0 22.97V1.99C0 .92.877.047 1.95.047h21.053c1.073 0 1.95.874 1.95 1.943v20.98c0 1.068-.877 1.942-1.95 1.942" mask="url(#bikakao__b)"></path></g><mask id="bikakao__d" fill="#fff"><use xlink:href="#bikakao__c"></use></mask><path fill="#1E1E1E" d="M11.984 15.94h1.293V9.102h-1.293v6.838zm4.672-3.42c1.114-.732 1.85-1.989 1.85-3.419 0-2.26-1.839-4.091-4.107-4.091H7.516c-.132 0-.238.106-.238.236v14.548c0 .132.106.238.238.238h6.883c2.268 0 4.107-1.832 4.107-4.092 0-1.43-.736-2.688-1.85-3.42z" mask="url(#bikakao__d)"></path></g></svg>'],
      ['NH농협은행', '<svg width="20" height="25" viewBox="0 0 20 25"><path fill="#FCB813" fill-rule="evenodd" d="M19.422 1.408v4.668l-3.38 1.397.073.062c2.116 1.824 3.33 4.45 3.33 7.208 0 5.273-4.362 9.563-9.723 9.563-5.36 0-9.722-4.29-9.722-9.563 0-2.76 1.215-5.386 3.333-7.208l.073-.062L.03 6.076V1.408l5.864 2.459 3.248 6.058c-2.49.293-4.359 2.347-4.359 4.818 0 2.679 2.213 4.86 4.939 4.86 2.723 0 4.937-2.181 4.937-4.86 0-2.471-1.87-4.525-4.36-4.818.07-.136 3.251-6.058 3.251-6.058l5.872-2.46zM14.46.694L9.72 9.546 4.99.694l4.73 2.34 4.74-2.34z"></path></svg>']
    ];

    const logoEl = document.createElement("div");
    logoEl.className = "accountLi__logo";
    logoList.map( ([name, img]) => {
      if(name === item.bankName){
        logoEl.innerHTML = img;
      }
    });

    const bankNameEl = document.createElement("div");
    bankNameEl.className = "accountLi__bankName";
    bankNameEl.innerText = item.bankName;

    const accountNumberEl = document.createElement("div");
    accountNumberEl.className = "accountLi__accountNumber";
    accountNumberEl.innerText = item.accountNumber;

    const balanceEl = document.createElement("div");
    balanceEl.className = "accountLi__balance";
    balanceEl.innerText = `${item.balance.toLocaleString()} 원`;

    accountLiEl.append(logoEl, bankNameEl, accountNumberEl, balanceEl);

    return accountLiEl;
  });
  contentEl.append(...accountEl);
}

export async function renderMyProfile() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  const app = document.querySelector("#app");
  app.innerHTML = "";

  app.append(handlingLoading(true));

  let loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증

  if (!loginState) {
    const loading = document.querySelector(".skeleton");
    loading.remove();

    const loginMessageEl = document.createElement("div");
    loginMessageEl.className = "loginMessage";
    loginMessageEl.innerText = "로그인이 필요합니다!";

    app.append(loginMessageEl);
    return
  }

  const profile = await userAuth(userToken._token);
  const sectionEl = document.createElement("section");
  const articleEl = document.createElement("article");
  
  sectionEl.className = "myPage";

  app.append(sectionEl);  

  await renderSideMenu(sectionEl, articleEl);
  
  
  articleEl.innerHTML = /* html */`
    <h2>나의 정보</h2>
    <p>이름, 비밀번호, 프로필 이미지를 확인하고 수정할 수 있습니다.</p>

    <div class="my-profile">
      <div class="profile-image"></div>
      <div class="edit-image--btns">
        <label>
          <input type="file" accept="image/gif,image/jpeg,image/png" />
          <span class="edit-btn edit">이미지 변경</span>
        </label>
      </div>
      <div class="edit-name">
        <div class="info">
          <div class="info--display-name">${profile.displayName}</div>
          <div class="info--email">${profile.email}</div>
        </div>
        <div class="edit-name-btns">
          <div class="edit-cancel--btn hidden">
            <span>변경취소</span>
            <span class="material-symbols-outlined icon">
             do_not_disturb_on
            </span>
          </div>
          <div class="edit-name--btn">
            <span>이름변경</span>
            <span class="material-symbols-outlined icon">
              edit
            </span>
          </div>
        </div>
      </div>
    </div>
    <form class="edit-password">
      <h3>비밀번호 변경</h3>

      <div class="edit-password--input">
        <div class="input-password origin">
          <label>
            <span>현재 비밀번호</span>
            <input type="password" />
          </label>
          <span class="message">현재 비밀번호를 입력해주세요 (8자 이상)</span>
        </div>
        <div class="input-password new">
          <label>
            <span>새 비밀번호</span>
            <input type="password" />
          </label>
          <span class="message">새 비밀번호를 입력해주세요 (8자 이상)</span>
        </div>
        <div class="input-password check">
          <label>
            <span>비밀번호 확인</span>
            <input type="password" />
          </label>
          <span class="message">새 비밀번호를 한번 더 입력해주세요</span>
        </div>
      </div>
      <div class="submit-password-btns">
        <button type="reset" class="common-btn">취소<button>
        <button class="darken-btn submit-password">비밀번호 변경<button>
      </div>
    </form>

    <div class="password-modal modal-bg">
      <div class="modal">
        <div class="icon load">
          <span class="loading"></span>
          <span class="material-symbols-outlined done-icon">
           done
          </span>
          <span class="material-symbols-outlined fail-icon">
            sms_failed
          </span>
        </div>
        <h2>비밀번호 변경중...</h2>
        <button class="common-btn back hidden">확인</button>
      </div>
    </div>

    <div class="loader-bg hidden">
      <div class="loader-box">
        <span class="loading"></span>
        <span class="loading-text">loading...</span>
      </div>
    </div>
  `;

  const profileImgEl = document.querySelector('.my-profile .profile-image');
  const inputImgEl = document.querySelector('.my-profile .edit-image--btns input[type="file"]');
  const displayNameEl = document.querySelector('.my-profile .edit-name .info .info--display-name');
  const cancelEditNameEl = document.querySelector('.my-profile .edit-name .edit-cancel--btn');
  const editNameEl = document.querySelector('.my-profile .edit-name .edit-name--btn');
  const passwordFormEl = document.querySelector('.edit-password');
  const originPwInputEl = passwordFormEl.querySelector('.input-password.origin input');
  const newPwInputEl = passwordFormEl.querySelector('.input-password.new input');
  const chkPwInputEl = passwordFormEl.querySelector('.input-password.check input');
  const originPwMsgEl = passwordFormEl.querySelector('.input-password.origin .message');
  const newPwMsgEl = passwordFormEl.querySelector('.input-password.new .message');
  const chkPwMsgEl = passwordFormEl.querySelector('.input-password.check .message');
  const modalBgEl = document.querySelector(".password-modal.modal-bg");
  const modalIconEl = modalBgEl.querySelector(".icon");
  const modalH2El = modalBgEl.querySelector("h2");
  const modalBtn = modalBgEl.querySelector(".common-btn.back");
  const loaderBg = document.querySelector('.loader-bg');

  const headerProfileImgEl = document.querySelector('header .side .login .icon');
  const headerDisplayNameEl = document.querySelector('header .side .login .login--text');
  const sideProfileImgEl = document.querySelector('.myPage .leftSideMenu .profile .profile__list .profile__list--img');
  const sideDisplayNameEl = document.querySelector('.myPage .leftSideMenu .profile .profile__list .profile__list--displayName');

  let newPassword = "";
  let userName = profile.displayName;

  let data = {
    userToken : userToken._token,
    user : {},
  }

  if(profile.profileImg) {
    profileImgEl.style.backgroundImage = `url(${profile.profileImg})`;
  } else {
    profileImgEl.style.backgroundImage = 'url(https://www.tutor-guru.com/assets/images/tasker/noprofile.png)';
  }
  
  const loading = document.querySelector(".skeleton");
  loading.remove();

  // 이미지 변경
  inputImgEl.addEventListener('change', (e) => {
    loaderBg.classList.remove('hidden');

    const file = e.target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.addEventListener('load', async (evt) => {
      data.user.profileImgBase64 = evt.target.result;
      await userInfoEdit(data);

      profileImgEl.style.backgroundImage = `url(${evt.target.result})`;
      headerProfileImgEl.style.backgroundImage = `url(${evt.target.result})`;
      sideProfileImgEl.style.backgroundImage = `url(${evt.target.result})`;
      headerProfileImgEl.classList.add('profile');
      loaderBg.classList.add('hidden');
    })
  })

  editNameEl.addEventListener('click', async () => {
    //이름변경완료
    if (editNameEl.classList.contains('confirm')) {
      loaderBg.classList.remove('hidden');

      data.user.displayName = displayNameEl.textContent;
      console.log(data)
      await userInfoEdit(data);
      
      userName = displayNameEl.textContent;

      displayNameEl.removeAttribute("contenteditable");
      editNameEl.classList.remove('confirm');
      cancelEditNameEl.classList.add('hidden');  
      
      editNameEl.firstElementChild.textContent = "이름변경";
      sideDisplayNameEl.textContent = displayNameEl.textContent;
      headerDisplayNameEl.innerHTML = /* html */ `
        ${displayNameEl.textContent} 님!
        <span class="material-symbols-outlined">
          arrow_drop_down
        </span>
        `;
      
      loaderBg.classList.add('hidden');
      return;
    }
    
    // 이름변경
    displayNameEl.setAttribute("contenteditable", "true");
    displayNameEl.focus();
    
    editNameEl.firstElementChild.textContent = "변경완료";

    editNameEl.classList.add('confirm');
    cancelEditNameEl.classList.remove('hidden');
  })

  // 이름변경 취소
  cancelEditNameEl.addEventListener('click', () => {
    displayNameEl.removeAttribute("contenteditable");
    editNameEl.classList.remove('confirm');
    cancelEditNameEl.classList.add('hidden');  
    editNameEl.firstElementChild.textContent = "이름변경";

    displayNameEl.textContent = userName;
  })

  // 이름길이 제한, 기타동작방지
  displayNameEl.addEventListener('input', e => {
    if(!e.data && e.inputType === 'insertText' || e.inputType === 'insertParagraph') {
      e.target.innerHTML = e.target.innerHTML.replaceAll(/<.+>/g,'');
    }
    if(e.data = ' ') {
      e.target.innerHTML = e.target.innerHTML.replaceAll(/&.+;/g,'');
    }

    if(displayNameEl.textContent.length >= 20) {
      displayNameEl.textContent = displayNameEl.textContent.slice(0,-1);

      alert('이름은 20자를 넘어갈 수 없습니다');
    }
  })

  // 비밀번호변경
  passwordFormEl.addEventListener('input', (e) => {
    const targetType = e.target.closest('.input-password')
    const targetValue = e.target.value;
    if(e.data === " ") {
      e.target.value = e.target.value.replaceAll(" ", "")
      return;
    }
    
    //현재비밀번호
    if(targetType.classList.contains('origin')) {
      originPwMsgEl.className = "message";

      if (0 < targetValue.length && targetValue.length < 8) {
        originPwMsgEl.classList.add('warn')
      } else if (8 <= targetValue.length) {
        originPwMsgEl.classList.add('complete')
      }
    }

    //새비밀번호
    if(targetType.classList.contains('new')) {
      newPassword = targetValue;
      newPwMsgEl.className = "message";
      
      if(0 < newPassword.length && newPassword.length < 8) {
        newPwMsgEl.classList.add('warn')
        newPwMsgEl.textContent = "새 비밀번호를 입력해주세요 (8자 이상)"
      } else if (originPwInputEl.value === newPassword) {
        newPwMsgEl.classList.add('warn')
        newPwMsgEl.textContent = "현재 비밀번호와 일치합니다"
      } else if (8 <= newPassword.length) {
        newPwMsgEl.classList.add('complete')
        newPwMsgEl.textContent = "새 비밀번호를 입력해주세요 (8자 이상)"
      }
    }

    //비밀번호 확인
    if(targetType.classList.contains('check')) {
      chkPwMsgEl.className = "message";

      if(targetValue.length === 0){
        chkPwMsgEl.textContent = "새 비밀번호를 한번 더 입력해주세요";
      } else if (targetValue.length < 8) {
        chkPwMsgEl.classList.add('warn')
        chkPwMsgEl.textContent = "새 비밀번호를 한번 더 입력해주세요 (8자 이상)";
      } else if (targetValue === newPassword) {
        chkPwMsgEl.classList.add('complete')
        chkPwMsgEl.textContent = "비밀번호가 일치합니다";
      } else {
        chkPwMsgEl.classList.add('warn')
        chkPwMsgEl.textContent = "비밀번호가 일치하지 않습니다";
      }
    } 
  })

  //비밀번호 변경완료
  passwordFormEl.addEventListener('submit', async e => {
    e.preventDefault();
    modalBgEl.classList.add("show");
    document.body.style.overflow = "hidden";

    if (originPwMsgEl.classList.contains('complete') 
    && newPwMsgEl.classList.contains('complete') 
    && chkPwMsgEl.classList.contains('complete')) {

      //데이터전송
      data.user.oldPassword = originPwInputEl.value;
      data.user.newPassword = newPassword;
      
      const res = await userInfoEdit(data);
      modalIconEl.className = "icon"
      modalBtn.classList.remove('hidden')

      if (typeof res === "object") {
        modalH2El.textContent = '비밀번호가 변경되었습니다';
        modalIconEl.classList.add('done')

        originPwInputEl.value = "";
        newPwInputEl.value = "";
        chkPwInputEl.value = "";

        originPwMsgEl.className = "message";
        newPwMsgEl.className = "message";
        chkPwMsgEl.className = "message";
      } else {
        modalIconEl.classList.add('fail')
        modalH2El.textContent = res;
      }

      return;
    }

    //변경실패
    modalIconEl.classList.remove('load')
    modalIconEl.classList.add('fail')
    modalBtn.classList.remove('hidden')
    modalH2El.textContent = '비밀번호를 다시한번 확인해주세요';
  })

  //모달닫기, 초기화
  modalBtn.addEventListener('click', e => {
    modalIconEl.classList.add('load')
    modalIconEl.classList.remove('fail')
    modalIconEl.classList.remove('done')
    modalBtn.classList.add('hidden')
    modalBgEl.classList.remove('show')
    
    modalH2El.textContent = '비밀번호 변경중...';
    document.body.style.overflow = "unset";
  })

  modalBgEl.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      modalBtn.click()
    }
  });
}

async function renderSideMenu(sectionEl, articleEl) {

  const profile = await userAuth(userToken._token);
  const buyList = await getBuyList(userToken._token);
  const accountList = await getCurrentAccount(userToken._token);

  // 화면 왼쪽 사이드 메뉴 생성(프로필, 주문•배송, 잔액, 주문, 계좌, 정보)
  const leftSideMenuEl = document.createElement("nav");
  leftSideMenuEl.className = "leftSideMenu";

  // 프로필 표시
  const profileEl = document.createElement("div");
  profileEl.className = "profile";

  // 프로필 표시할 항목(이미지, 표시이름, 이메일)
  const profileUlEl = document.createElement("ul");
  profileUlEl.className = "profile__list";
  profileEl.append(profileUlEl);

  // 이미지
  const imgLiEl = document.createElement("li");
  imgLiEl.className = "profile__list--img";

  // profileImg가 존재 할 경우 해당 이미지를 현재 태그 배경으로 설정
  if (profile.profileImg) {
    imgLiEl.style.backgroundImage = `url(${profile.profileImg})`;
    imgLiEl.style.backgroundSize = "cover";
  }

  // 표시이름
  const displayNameLiEl = document.createElement("li");
  displayNameLiEl.className = "profile__list--displayName";
  displayNameLiEl.innerText = profile.displayName;

  // 이메일
  const emailLiEl = document.createElement("li");
  emailLiEl.className = "profile__list--email";
  emailLiEl.innerText = profile.email;

  profileUlEl.append(imgLiEl, displayNameLiEl, emailLiEl);

  // 메뉴의 버튼들 생성
  const myPageBtnsEl = document.createElement("div");
  myPageBtnsEl.className = "myPageBtns";

  // 주문•배송, 나의 잔액 표시할 div 생성
  const myPageSummaryEl = document.createElement("div");
  myPageSummaryEl.className = "myPageSummary";

  // 주문•배송
  const orderDeliveryEl = document.createElement("div");
  orderDeliveryEl.className = "myPageSummary__btns";

  // 주문•배송 이름 부분 div 생성
  const orderDeliveryNameEl = document.createElement("div");
  orderDeliveryNameEl.className = "myPageSummary__btns__name";
  orderDeliveryNameEl.innerHTML =
    '<span class="material-symbols-outlined">local_shipping</span> 주문•배송';

  // 주문•배송 현황 값 가져오기
  const orderDeliveryValue = buyList.filter(
    (e) => e.done === false && e.isCanceled === false // 아직 구매취소x, 구매확정x
  ).length;

  // 주문•배송 현황 값 표시
  const orderDeliveryValueEl = document.createElement('a');
  orderDeliveryValueEl.className = "myPageSummary__btns__value";
  orderDeliveryValueEl.innerText = `${orderDeliveryValue} 건`
  orderDeliveryValueEl.addEventListener('click', () => {
    router.navigate('/mypage/order');
  })

  orderDeliveryEl.append(orderDeliveryNameEl, orderDeliveryValueEl);

  // 나의 잔액
  const balanceEl = document.createElement("div");
  balanceEl.className = "myPageSummary__btns";

  // 나의 잔액 이름 부분 div 생성
  const balanceNameEl = document.createElement("div");
  balanceNameEl.className = "myPageSummary__btns__name";
  balanceNameEl.innerHTML =
    '<span class="material-symbols-outlined">local_atm</span> 나의 잔액';

  // 나의 잔액 값 가져오기
  const balanceValue = accountList.totalBalance.toLocaleString();

  // 나의 잔액 값 표시
  const balanceValueEl = document.createElement('a');
  balanceValueEl.className = "myPageSummary__btns__value";
  balanceValueEl.innerText = `${balanceValue} 원`;
  balanceValueEl.addEventListener('click', () => {
    router.navigate('/mypage/account');
  })

  balanceEl.append(balanceNameEl, balanceValueEl);

  myPageSummaryEl.append(orderDeliveryEl, balanceEl);

  // 나의 주문
  const myOrderBtnEl = document.createElement('a');
  myOrderBtnEl.className = 'myPageBtns__link';
  myOrderBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">shop_two</span> 나의 주문';
  myOrderBtnEl.addEventListener('click', () => {
    router.navigate('/mypage/order');
  });

  // 나의 계좌
  const myAccountBtnEl = document.createElement('a');
  myAccountBtnEl.className = 'myPageBtns__link';
  myAccountBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">payments</span> 나의 계좌';
  myAccountBtnEl.addEventListener('click', () => {
    router.navigate('/mypage/account');
  });

  // 나의 정보
  const myInfoBtnEl = document.createElement('a');
  myInfoBtnEl.className = 'myPageBtns__link';
  myInfoBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">person</span> 나의 정보';
  myInfoBtnEl.addEventListener('click', () => {
    router.navigate('/mypage');
  })

  myPageBtnsEl.append(
    myPageSummaryEl,
    myOrderBtnEl,
    myAccountBtnEl,
    myInfoBtnEl
  );

  leftSideMenuEl.append(profileEl, myPageBtnsEl);

  sectionEl.append(leftSideMenuEl, articleEl);
}

function handlingLoading(account = false) {
  const loadingEl = document.createElement("div");

  loadingEl.classList.add("skeleton");
  if (account) {
    loadingEl.innerHTML = `
   <div class="nav__loading">
     <div class="nav__loading--img"></div>
     <div class="nav__loading--text"></div>
     <div class="nav__loading--text"></div>
     <div class="nav__loading--current">
      <div></div>
      <div></div>
     </div>
     <div class="nav__loading--content"></div>
     <div class="nav__loading--content"></div>
     <div class="nav__loading--content"></div>
   </div>
   <div class="main__loading account">
    <div class="main__loading--title"></div>
    <div class="main__loading--content"></div>
    <div class="main__loading--content"></div>
    <div class="main__loading--content"></div>
   </div>
   `;
  } else {
    loadingEl.innerHTML = `
   <div class="nav__loading">
     <div class="nav__loading--img"></div>
     <div class="nav__loading--text"></div>
     <div class="nav__loading--text"></div>
     <div class="nav__loading--current">
      <div></div>
      <div></div>
     </div>
     <div class="nav__loading--content"></div>
     <div class="nav__loading--content"></div>
     <div class="nav__loading--content"></div>
   </div>
   <div class="main__loading">
    <div class="main__loading--title"></div>
    <div class="main__loading--content">
      <div class="content--img"></div>
      <div class="content--text"></div>
      <div class="content--text"></div>
      <div class="content--btn"></div>
   </div>
    <div class="main__loading--content">
      <div class="content--img"></div>
      <div class="content--text"></div>
      <div class="content--text"></div>
      <div class="content--btn"></div>
   </div>
    <div class="main__loading--content">
      <div class="content--img"></div>
      <div class="content--text"></div>
      <div class="content--text"></div>
      <div class="content--btn"></div>
   </div>
   </div>
   `;
  }

  return loadingEl;
}
