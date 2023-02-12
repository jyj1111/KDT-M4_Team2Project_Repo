import "../style/mypage.scss";
import { router } from "../route";
import { userToken, afterLoadUserAuth } from "../utilities/userAuth";
import { userAuth, getBankAccount, getCurrentAccount } from "../utilities/userapi";
import { getBuyList } from "../utilities/productapi";

export async function renderOrderHisory() {
  const app = document.querySelector("#app");
  app.innerHTML = "";

  const loginState = await afterLoadUserAuth(); // 토큰 유무/유효 검증
  if(!loginState) {
    const loginMessageEl = document.createElement('div');
    loginMessageEl.className = 'loginMessage';
    loginMessageEl.innerText = '로그인이 필요합니다!';

    app.append(loginMessageEl);
  }
  else {
    const sectionEl = document.createElement('section');
    sectionEl.className = "myPage";
    const articleEl = document.createElement('article');
    
    await renderSideMenu(sectionEl, articleEl);
  
    app.append(sectionEl);
  }
}

async function renderSideMenu(sectionEl, articleEl) {
  // 화면 왼쪽 사이드 메뉴 생성(프로필, 주문•배송, 잔액, 주문, 계좌, 정보)
  const leftSideMenuEl = document.createElement('nav');
  leftSideMenuEl.className = "leftSideMenu";
  
  // 프로필 표시
  const profileEl = document.createElement('div')
  profileEl.className = "profile";
  
  // 토큰을 변수에 저장, 사용자 정보 가져오기
  const token = userToken._token;
  const profile = await userAuth(token);  
  
  // 프로필 표시할 항목(이미지, 표시이름, 이메일)
  const profileUlEl = document.createElement('ul');
  profileUlEl.className = "profile__list"
  profileEl.append(profileUlEl);

  // 이미지
  const imgLiEl = document.createElement('li');
  imgLiEl.className = "profile__list--img";

  // profileImg가 존재 할 경우 해당 이미지를 현재 태그 배경으로 설정
  if(profile.profileImg){
    imgLiEl.style.backgroundImage = `url(${profile.profileImg})`;
  }

  // 표시이름
  const displayNameLiEl = document.createElement('li');
  displayNameLiEl.className = "profile__list--displayName";
  displayNameLiEl.innerText = profile.displayName;

  // 이메일
  const emailLiEl = document.createElement('li');
  emailLiEl.className = "profile__list--email";
  emailLiEl.innerText = profile.email;

  profileUlEl.append(imgLiEl, displayNameLiEl, emailLiEl);

  // 메뉴의 버튼들 생성
  const myPageBtnsEl = document.createElement('div');
  myPageBtnsEl.className = "myPageBtns";

  // 주문•배송, 나의 잔액 표시할 div 생성
  const myPageSummaryEl = document.createElement('div');
  myPageSummaryEl.className = "myPageSummary";

  // 주문•배송
  const orderDeliveryEl = document.createElement('div');
  orderDeliveryEl.className = "myPageSummary__btns";

  // 주문•배송 이름 부분 div 생성
  const orderDeliveryNameEl = document.createElement('div');
  orderDeliveryNameEl.className = "myPageSummary__btns__name";
  orderDeliveryNameEl.innerHTML = 
  '<span class="material-symbols-outlined">local_shipping</span> 주문•배송';

  // 주문•배송 현황 값 가져오기
  const buyList = await getBuyList(token);
  const orderDeliveryValue = buyList.filter( e => 
    (e.done === false) && (e.isCanceled === false) // 아직 구매취소x, 구매확정x
  ).length;
  
  // 주문•배송 현황 값 표시
  const orderDeliveryValueEl = document.createElement('div');
  orderDeliveryValueEl.className = "myPageSummary__btns__value";
  orderDeliveryValueEl.innerText = `${orderDeliveryValue} 건`

  orderDeliveryEl.append(orderDeliveryNameEl, orderDeliveryValueEl);

  // 나의 잔액
  const balanceEl = document.createElement('div');
  balanceEl.className = "myPageSummary__btns";
  
  // 나의 잔액 이름 부분 div 생성
  const balanceNameEl = document.createElement('div');
  balanceNameEl.className = "myPageSummary__btns__name";
  balanceNameEl.innerHTML = 
  '<span class="material-symbols-outlined">local_atm</span> 나의 잔액';
  
  // 나의 잔액 값 가져오기
  const currentAccount = await getCurrentAccount(token);
  const balanceValue = currentAccount.totalBalance.toLocaleString();
  
  // 나의 잔액 값 표시
  const balanceValueEl = document.createElement('div');
  balanceValueEl.className = "myPageSummary__btns__value";
  balanceValueEl.innerText = `${balanceValue} 원`;

  balanceEl.append(balanceNameEl, balanceValueEl);

  myPageSummaryEl.append(orderDeliveryEl, balanceEl);

  // 나의 주문
  const myOrderBtnEl = document.createElement('a');
  myOrderBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">shop_two</span> 나의 주문';

  // 나의 계좌
  const myAccountBtnEl = document.createElement('a');
  myAccountBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">payments</span> 나의 계좌';

  // 나의 정보
  const myInfoBtnEl = document.createElement('a');
  myInfoBtnEl.innerHTML = 
  '<span class="material-symbols-outlined">person</span> 나의 정보';

  myPageBtnsEl.append(myPageSummaryEl, myOrderBtnEl, myAccountBtnEl, myInfoBtnEl);

  leftSideMenuEl.append(profileEl, myPageBtnsEl);

  sectionEl.append(leftSideMenuEl, articleEl);
}